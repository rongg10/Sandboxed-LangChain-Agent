import "server-only";

import { spawn } from "node:child_process";
import path from "node:path";

// Server-only runner that shells out to the existing Python agent.
type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const PYTHON_BIN = process.env.PYTHON_BIN || "python";
const AGENT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS || "20000");

function formatMessages(messages: ChatMessage[]): string {
  const labels: Record<ChatMessage["role"], string> = {
    user: "User",
    assistant: "Assistant",
    system: "System",
  };

  return messages
    .map((message) => `${labels[message.role]}: ${message.content.trim()}`)
    .join("\n\n");
}

export async function runAgent(messages: ChatMessage[]): Promise<string> {
  const prompt = formatMessages(messages);
  const scriptPath = path.join(process.cwd(), "main.py");

  return await new Promise((resolve, reject) => {
    // Spawn the Python agent on the server so API keys never touch the client.
    const child = spawn(PYTHON_BIN, [scriptPath, prompt], {
      env: {
        ...process.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Agent timed out."));
    }, AGENT_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(stderr || `Agent exited with code ${code}.`));
        return;
      }
      resolve(stdout.trim() || "(no output)");
    });
  });
}
