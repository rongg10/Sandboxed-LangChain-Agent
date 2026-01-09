import argparse
import asyncio
import os
import re
from typing import Any, AsyncIterator, Callable, Optional

from sandbox_tool import SandboxedPythonTool

SYSTEM_PROMPT = (
    "You are a careful assistant. When the user asks to calculate or to use code, "
    "you must call the sandboxed_python tool. The tool returns JSON with fields "
    "like status, stdout, stderr, exit_code, and timed_out. Read that output and "
    "decide what to do next: fix and rerun if status=error/timeout, or parse/summarize "
    "stdout when status=ok/warning. If stdout is '(no output)' but a result is needed, "
    "rerun with explicit print statements. Keep responses concise and explain results."
    " If a filename is mentioned, assume it lives in /data and use absolute paths."
    " If a file is missing, run os.listdir('/data') and retry."
)


def _extract_output(result: Any) -> str:
    if isinstance(result, dict):
        if "output" in result:
            return str(result["output"])
        messages = result.get("messages") or []
        if messages:
            last = messages[-1]
            if hasattr(last, "content"):
                return last.content or ""
            if isinstance(last, dict):
                return str(last.get("content", ""))
            return str(last)
    return str(result)


def _verbose_enabled() -> bool:
    # Default to quiet output so the web UI only shows the final answer.
    return os.getenv("LANGCHAIN_VERBOSE", "0").lower() not in {"0", "false", "no"}


def _message_role(message: Any) -> str:
    if hasattr(message, "type"):
        return str(message.type)
    if isinstance(message, dict):
        return str(message.get("role", ""))
    return ""


def _message_text(message: Any) -> str:
    if hasattr(message, "content"):
        return str(message.content or "")
    if isinstance(message, dict):
        return str(message.get("content", ""))
    return str(message)


def _should_force_tool(text: str) -> bool:
    lowered = text.lower()
    if any(
        marker in lowered
        for marker in (
            "using code",
            "use code",
            "run code",
            "execute code",
            "calculate",
            "compute",
            "evaluate",
            "python",
        )
    ):
        return True
    if "**" in text:
        return True
    if re.search(r"\d\s*[\+\-\*\/\%\^]\s*\d", text):
        return True
    return False


def _create_agent(streaming: bool):
    tools = [SandboxedPythonTool()]
    model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    try:
        from langchain.agents import create_agent
        from langchain_openai import ChatOpenAI
    except Exception:
        create_agent = None
        ChatOpenAI = None

    if create_agent is not None and ChatOpenAI is not None:
        middleware = []
        try:
            from langchain.agents.middleware import wrap_model_call

            @wrap_model_call
            def enforce_tool_choice(request, handler):
                if request.messages:
                    role = _message_role(request.messages[-1])
                    if role in {"human", "user"}:
                        text = _message_text(request.messages[-1])
                        if _should_force_tool(text):
                            return handler(
                                request.override(tool_choice="sandboxed_python")
                            )
                return handler(request)

            middleware = [enforce_tool_choice]
        except Exception:
            middleware = []

        llm = ChatOpenAI(model=model_name, temperature=0, streaming=streaming)
        agent = create_agent(
            model=llm,
            tools=tools,
            system_prompt=SYSTEM_PROMPT,
            middleware=middleware,
            debug=_verbose_enabled(),
        )
        return agent, "messages"

    from langchain.agents import AgentExecutor, create_openai_tools_agent
    from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(model=model_name, temperature=0, streaming=streaming)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ]
    )
    agent = create_openai_tools_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools, verbose=_verbose_enabled())
    return executor, "input"


def _create_stream_handler():
    try:
        from langchain.callbacks.base import AsyncCallbackHandler
    except Exception:
        from langchain_core.callbacks.base import AsyncCallbackHandler

    class _QueueCallbackHandler(AsyncCallbackHandler):
        def __init__(self) -> None:
            self.queue: asyncio.Queue[str] = asyncio.Queue()
            self.done = asyncio.Event()

        async def on_llm_new_token(self, token: str, **kwargs) -> None:
            if token:
                await self.queue.put(token)

        async def aiter(self) -> AsyncIterator[str]:
            while True:
                if self.queue.empty() and self.done.is_set():
                    break
                try:
                    token = await asyncio.wait_for(self.queue.get(), timeout=0.1)
                except asyncio.TimeoutError:
                    continue
                yield token

    return _QueueCallbackHandler()


def _mark_handler_done(handler: Any) -> None:
    done = getattr(handler, "done", None)
    if hasattr(done, "set"):
        done.set()


async def _ainvoke_with_callbacks(agent: Any, payload: dict[str, Any], handler: Any) -> Any:
    try:
        return await agent.ainvoke(payload, config={"callbacks": [handler]})
    except TypeError:
        return await agent.ainvoke(payload, callbacks=[handler])


def build_agent() -> Callable[[str], str]:
    agent, mode = _create_agent(streaming=False)

    def run(prompt: str) -> str:
        if mode == "messages":
            result = agent.invoke({"messages": [{"role": "user", "content": prompt}]})
        else:
            result = agent.invoke({"input": prompt})
        output = _extract_output(result)
        return output

    return run


def build_agent_streamer() -> Callable[[str], AsyncIterator[str]]:
    fallback = build_agent()
    try:
        agent, mode = _create_agent(streaming=True)
    except Exception:
        agent = None
        mode = "input"

    if agent is None or not hasattr(agent, "ainvoke"):

        async def stream(prompt: str) -> AsyncIterator[str]:
            yield await asyncio.to_thread(fallback, prompt)

        return stream

    async def stream(prompt: str) -> AsyncIterator[str]:
        handler = _create_stream_handler()
        if mode == "messages":
            payload = {"messages": [{"role": "user", "content": prompt}]}
        else:
            payload = {"input": prompt}

        error: Optional[Exception] = None
        emitted = False

        async def _run() -> None:
            nonlocal error
            try:
                await _ainvoke_with_callbacks(agent, payload, handler)
            except Exception as exc:
                error = exc
            finally:
                _mark_handler_done(handler)

        task = asyncio.create_task(_run())
        try:
            async for token in handler.aiter():
                if token:
                    emitted = True
                    yield token
        finally:
            await task

        if error is not None:
            if not emitted and isinstance(
                error, (AttributeError, NotImplementedError, TypeError)
            ):
                yield await asyncio.to_thread(fallback, prompt)
            else:
                raise error

    return stream


def main() -> None:
    parser = argparse.ArgumentParser(description="Sandboxed LangChain agent")
    parser.add_argument("prompt", nargs="*", help="Prompt to send to the agent")
    args = parser.parse_args()

    agent = build_agent()

    if args.prompt:
        prompt = " ".join(args.prompt)
        print(agent(prompt))
        return

    print("Interactive mode. Type 'exit' to quit.")
    while True:
        try:
            line = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye.")
            break
        if not line:
            continue
        if line.lower() in {"exit", "quit"}:
            print("Bye.")
            break
        print(agent(line))


if __name__ == "__main__":
    main()
