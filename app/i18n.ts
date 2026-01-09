export type Language = "en" | "zh";

export const translations = {
  en: {
    brandName: "Sandboxed Agent",
    brandTagline: "Dual-sandbox agent runtime",
    navProduct: "Product",
    navArchitecture: "Architecture",
    navExamples: "Examples",
    navContact: "Contact",
    ctaRequestDemo: "Request demo",
    ctaOpenConsole: "Open console",
    ctaBackOverview: "Back to overview",
    ctaOpenLiveConsole: "Open live console",
    ctaStartSession: "Start a session",
    ctaExploreArchitecture: "Explore architecture",
    heroEyebrow: "Pyodide + CPython execution",
    heroTitle: "Run fast checks or full data science workflows safely.",
    heroSubhead:
      "Route lightweight work to Pyodide and heavier analysis to CPython with pandas, numpy, matplotlib, and seaborn. Outputs stream back as structured JSON, plus images you can preview and download.",
    inputPlaceholder: "Ask the agent to run a task",
    inputAria: "Agent request",
    sessionFormButton: "Start session",
    sampleTitle: "You can ask:",
    samplePrompt1: `Generate all prime numbers below 1000.
Then:
compute how many there are,
calculate the average gap between consecutive primes, and
return the largest gap found.`,
    samplePrompt2: `Using code only:
1. Create a list of 10,000 integers from 0 to 9,999.
2. Shuffle the list with a fixed random seed of 12345.
3. Remove all numbers divisible by 7.
4. Square the remaining numbers.
5. Compute and print:
   - the length of the final list
   - the first 5 elements
   - the last 5 elements.`,
    metricTimeout: "Default timeout",
    metricFileSize: "File size cap",
    metricOpenFiles: "Open file limit",
    trustRowOne: "Two sandbox modes",
    trustRowTwo: "DS libraries ready",
    trustRowThree: "Image preview + download",
    panelTitle: "Session preview",
    panelSubtitle: "From quick checks to full analysis",
    panelStatus: "Sandbox",
    previewRequestLabel: "Request",
    previewRequestText: "Generate primes below 1000 and summarize the gaps",
    previewAgentLabel: "Agent",
    previewAgentText: "Chose Pyodide or CPython and returned JSON output",
    previewAuditLabel: "Audit",
    previewAuditText: "Captured stdout, stderr, exit code, and images",
    infoProductTitle: "Product",
    infoProductText:
      "A dual-sandbox agent that runs quick checks in Pyodide or full data science jobs in CPython, returning structured JSON and images.",
    infoArchitectureTitle: "Architecture",
    infoArchitectureText:
      "Next.js UI + FastAPI backend with a router that picks Pyodide or CPython based on workload and libraries.",
    infoContactTitle: "Contact",
    infoContactText:
      "Reach out for access, pricing, or help deploying the dual-sandbox stack.",
    demoTitle: "Try the live console",
    demoSubtitle:
      "Run a prompt, view JSON output, and preview or download images.",
    footerText: "Built for local demos and lightweight automation checks.",
    architectureEyebrow: "Architecture",
    architectureTitle: "Two sandboxes, one unified interface.",
    architectureSubtitle:
      "A lightweight UI forwards requests to a FastAPI service that routes each task to Pyodide (fast) or CPython (full data science stack), then returns JSON plus images and downloads.",
    frontendTitle: "Frontend",
    frontendText:
      "Next.js renders the UI, streams responses, and displays images with download links.",
    backendRouterTitle: "Backend router",
    backendRouterText:
      "FastAPI receives requests, enforces limits, and selects Pyodide or CPython based on libraries and workload.",
    sandboxATitle: "Sandbox A (Pyodide)",
    sandboxAText:
      "Node + Pyodide for fast checks, strict limits, and quick validation tasks.",
    sandboxBTitle: "Sandbox B (CPython)",
    sandboxBText:
      "Full data science stack with pandas, numpy, matplotlib, and seaborn for analysis and plotting.",
    developedTitle: "How it was developed",
    developedText:
      "The project started as a minimal Pyodide agent and evolved into a dual-sandbox system. The team added routing logic, image handling, and session storage to support data science workflows without losing the safety of lightweight execution.",
    exampleSessionTitle: "Example session",
    exampleSessionSubtitle: "File analysis with pandas + image-ready outputs",
    exampleStatus: "Example",
    exampleUserPrompt: "examine health_env_ops_1000rows.csv",
    exampleAgentTranscript: `AGENT
I examined /data/health_env_ops_1000rows.csv. Quick summary and key findings:

File shape and columns
- Rows × cols: 1000 × 24
- Columns: date, region, population, day_of_week, is_weekend, is_holiday, is_service_disruption, temperature_c, humidity_pct, rain_mm, wind_kph, pm25_ug_m3, no2_ppb, pollen_index, flu_like_cases_index, pct_elderly, pct_children, staff_on_duty, clinic_visits, visits_per_10k, avg_wait_time_min, admission_rate, severe_day_flag, next_day_clinic_visits
- date values are all present and appear unique (1000 unique dates).

Missing data
- pm25_ug_m3: 9 missing (0.9%)
- no2_ppb: 12 missing (1.2%)
- pollen_index: 2 missing (0.2%)
- avg_wait_time_min: 5 missing (0.5%)
- next_day_clinic_visits: 1 missing (0.1%)

Categorical / low-cardinality columns
- region (5 values: South 217, North 204, Central 199, East 192, West 188)
- population (5 values matching regions)
- day_of_week (7 values)
- is_weekend, is_holiday, is_service_disruption, severe_day_flag (each binary)

Counts of some categories
- severe_day_flag: 0 → 875, 1 → 125
- is_weekend: 0 → 715, 1 → 285

Selected numeric summaries (count, mean, population std, min, 25%, 50%, 75%, max)
- clinic_visits: count=1000, mean=121.070, std=20.565, min=60, 25%=106, 50%=121, 75%=135, max=191
- next_day_clinic_visits: count=999, mean=121.107, std=20.541, min=60, 25%=106.5, 50%=121, 75%=135, max=191
- avg_wait_time_min: count=995, mean=92.42, std=16.01, min=42.9, 25%=80.7, 50%=92.2, 75%=102.95, max=152.1
- pm25_ug_m3: count=991, mean=25.02, std=5.95, min=7.6, 25%=20.9, 50%=25.2, 75%=29.3, max=43.4
- no2_ppb: count=988, mean=31.07, std=5.25, min=15.8, 25%=27.3, 50%=30.9, 75%=34.9, max=46.9
- visits_per_10k: count=1000, mean=2.418, std=0.454, min=1.212, 25%=2.092, 50%=2.41, 75%=2.714, max=3.857
- admission_rate: count=1000, mean=0.139, std=0.015, min=0.1, 25%=0.129, 50%=0.139, 75%=0.149, max=0.189
- temperature_c: count=1000, mean=26.25, std=2.577, min=19.8, 25%=24.3, 50%=26.5, 75%=28.2, max=33.5

First 5 rows (sample)
- 2023-01-01 | South | population=520000 | clinic_visits=84 | next_day_clinic_visits=113 | ...
- 2023-01-02 | Central | population=610000 | clinic_visits=113 | next_day_clinic_visits=127 | ...
- 2023-01-03 | West | population=500000 | clinic_visits=127 | next_day_clinic_visits=128 | ...
- 2023-01-04 | East | population=480000 | clinic_visits=128 | next_day_clinic_visits=106 | ...
- 2023-01-05 | North | population=420000 | clinic_visits=106 | next_day_clinic_visits=111 | ...

Notes / potential issues
- A few numeric columns have small numbers of missing values (pm25, no2, avg_wait_time, pollen, next_day_clinic_visits). Decide on imputation or row-dropping depending on analysis.
- date appears suitable for time-series use but should be parsed to a date type.
- Several numeric columns (visits_per_10k, admission_rate, pct_elderly/children) are already normalized/fractional — confirm units if needed.

Would you like me to do any of the following next?
- Parse date and show a time-series plot of clinic_visits (or next_day_clinic_visits).
- Correlation matrix (numeric cols) and highlight top predictors of next_day_clinic_visits.
- Show value distributions / histograms and detect outliers.
- Impute missing values (suggest method) and return a cleaned CSV.
- Fit a quick forecast model (e.g., simple regression or time-series) to predict next_day_clinic_visits.

Tell me which action you want and I’ll run it in the sandbox.`,
    contactEyebrow: "Contact",
    contactTitle: "Let's talk about your deployment.",
    contactSubtitle:
      "For access, partnerships, or support, reach out directly and we will respond quickly.",
    contactEmailTitle: "Email",
    chatTitle: "Live agent console",
    chatSubtitle: "Pyodide + CPython with JSON output and image previews",
    chatStatus: "Live",
    imagePanelTitle: "Images",
    imagePanelSubtitle: "Generated plots appear here and can be downloaded.",
    imageDownload: "Download",
    sessionFilesTitle: "Session files",
    sessionFilesSubtitlePrefix: "Uploaded files are copied to ",
    sessionFilesSubtitleSuffix: " for each run.",
    chooseFiles: "Choose files",
    upload: "Upload",
    uploading: "Uploading...",
    noFilesSelected: "No files selected.",
    uploadedLabel: "Uploaded:",
    youLabel: "You",
    agentLabel: "Agent",
    chatInputPlaceholder: "Ask the agent to run a task",
    chatInputAria: "Message",
    send: "Send",
    sending: "Sending...",
    chatStarter: "Hi! Share a task and I'll run it in the sandbox.",
    chatErrorUnexpected: "Unexpected server response.",
    chatErrorStream: "Stream error.",
    chatNoOutput: "(no output)",
    chatRequestFailed: "Request failed.",
    uploadFailed: "Upload failed.",
    openImageAria: "Open {name}",
    removeFileAria: "Remove {name}",
    closeImageAria: "Close image preview",
    loadingConsole: "Loading console",
    loadingStatus: "Loading",
  },
  zh: {
    brandName: "Sandboxed Agent",
    brandTagline: "双沙箱智能体运行时",
    navProduct: "产品",
    navArchitecture: "架构",
    navExamples: "示例",
    navContact: "联系",
    ctaRequestDemo: "申请演示",
    ctaOpenConsole: "打开控制台",
    ctaBackOverview: "返回概览",
    ctaOpenLiveConsole: "打开实时控制台",
    ctaStartSession: "开始会话",
    ctaExploreArchitecture: "查看架构",
    heroEyebrow: "Pyodide + CPython 执行",
    heroTitle: "安全运行快速检查或完整的数据科学流程。",
    heroSubhead:
      "将轻量任务交给 Pyodide，将更重的分析交给 CPython，支持 pandas、numpy、matplotlib、seaborn。输出以结构化 JSON 返回，并提供可预览和下载的图片。",
    inputPlaceholder: "让智能体执行一个任务",
    inputAria: "智能体请求",
    sessionFormButton: "开始会话",
    sampleTitle: "你可以这样问：",
    samplePrompt1: `生成所有小于 1000 的素数。
然后：
计算数量，
计算相邻素数的平均间隔，
并返回最大间隔。`,
    samplePrompt2: `仅用代码：
1. 创建 0 到 9,999 的 10,000 个整数列表。
2. 使用固定随机种子 12345 打乱列表。
3. 删除所有能被 7 整除的数。
4. 将剩余的数平方。
5. 计算并打印：
   - 最终列表长度
   - 前 5 个元素
   - 后 5 个元素。`,
    metricTimeout: "默认超时",
    metricFileSize: "文件大小上限",
    metricOpenFiles: "打开文件上限",
    trustRowOne: "双沙箱模式",
    trustRowTwo: "数据科学库就绪",
    trustRowThree: "图片预览与下载",
    panelTitle: "会话预览",
    panelSubtitle: "从快速检查到完整分析",
    panelStatus: "沙箱",
    previewRequestLabel: "请求",
    previewRequestText: "生成小于 1000 的素数并总结间隔",
    previewAgentLabel: "智能体",
    previewAgentText: "根据任务选择 Pyodide 或 CPython 并返回 JSON 输出",
    previewAuditLabel: "审计",
    previewAuditText: "记录 stdout、stderr、退出码和图片",
    infoProductTitle: "产品",
    infoProductText:
      "双沙箱智能体：Pyodide 做快速检查，CPython 运行数据科学任务，返回结构化 JSON 和图片。",
    infoArchitectureTitle: "架构",
    infoArchitectureText:
      "Next.js UI + FastAPI 后端，路由根据负载选择 Pyodide 或 CPython。",
    infoContactTitle: "联系",
    infoContactText: "获取访问、定价或部署支持，请联系我们。",
    demoTitle: "体验实时控制台",
    demoSubtitle: "输入提示，查看 JSON 输出，并预览或下载图片。",
    footerText: "用于本地演示与轻量自动化检查。",
    architectureEyebrow: "架构",
    architectureTitle: "两个沙箱，一个统一界面。",
    architectureSubtitle:
      "轻量 UI 将请求转发给 FastAPI 服务，按任务选择 Pyodide（快速）或 CPython（完整数据科学栈），并返回 JSON 与图片/下载。",
    frontendTitle: "前端",
    frontendText: "Next.js 渲染 UI、流式响应并展示可下载图片。",
    backendRouterTitle: "后端路由",
    backendRouterText:
      "FastAPI 接收请求、执行限制，并按库和负载选择 Pyodide 或 CPython。",
    sandboxATitle: "沙箱 A (Pyodide)",
    sandboxAText: "Node + Pyodide 用于快速检查、严格限制和验证任务。",
    sandboxBTitle: "沙箱 B (CPython)",
    sandboxBText:
      "完整的数据科学栈，支持 pandas、numpy、matplotlib、seaborn，用于分析与绘图。",
    developedTitle: "开发历程",
    developedText:
      "项目从最小化 Pyodide 智能体起步，逐步加入路由、图片处理和会话存储，在保持轻量安全的同时支持数据科学流程。",
    exampleSessionTitle: "示例会话",
    exampleSessionSubtitle: "使用 pandas 的文件分析 + 可输出图片",
    exampleStatus: "示例",
    exampleUserPrompt: "查看 health_env_ops_1000rows.csv",
    exampleAgentTranscript: `AGENT
I examined /data/health_env_ops_1000rows.csv. Quick summary and key findings:

File shape and columns
- Rows × cols: 1000 × 24
- Columns: date, region, population, day_of_week, is_weekend, is_holiday, is_service_disruption, temperature_c, humidity_pct, rain_mm, wind_kph, pm25_ug_m3, no2_ppb, pollen_index, flu_like_cases_index, pct_elderly, pct_children, staff_on_duty, clinic_visits, visits_per_10k, avg_wait_time_min, admission_rate, severe_day_flag, next_day_clinic_visits
- date values are all present and appear unique (1000 unique dates).

Missing data
- pm25_ug_m3: 9 missing (0.9%)
- no2_ppb: 12 missing (1.2%)
- pollen_index: 2 missing (0.2%)
- avg_wait_time_min: 5 missing (0.5%)
- next_day_clinic_visits: 1 missing (0.1%)

Categorical / low-cardinality columns
- region (5 values: South 217, North 204, Central 199, East 192, West 188)
- population (5 values matching regions)
- day_of_week (7 values)
- is_weekend, is_holiday, is_service_disruption, severe_day_flag (each binary)

Counts of some categories
- severe_day_flag: 0 → 875, 1 → 125
- is_weekend: 0 → 715, 1 → 285

Selected numeric summaries (count, mean, population std, min, 25%, 50%, 75%, max)
- clinic_visits: count=1000, mean=121.070, std=20.565, min=60, 25%=106, 50%=121, 75%=135, max=191
- next_day_clinic_visits: count=999, mean=121.107, std=20.541, min=60, 25%=106.5, 50%=121, 75%=135, max=191
- avg_wait_time_min: count=995, mean=92.42, std=16.01, min=42.9, 25%=80.7, 50%=92.2, 75%=102.95, max=152.1
- pm25_ug_m3: count=991, mean=25.02, std=5.95, min=7.6, 25%=20.9, 50%=25.2, 75%=29.3, max=43.4
- no2_ppb: count=988, mean=31.07, std=5.25, min=15.8, 25%=27.3, 50%=30.9, 75%=34.9, max=46.9
- visits_per_10k: count=1000, mean=2.418, std=0.454, min=1.212, 25%=2.092, 50%=2.41, 75%=2.714, max=3.857
- admission_rate: count=1000, mean=0.139, std=0.015, min=0.1, 25%=0.129, 50%=0.139, 75%=0.149, max=0.189
- temperature_c: count=1000, mean=26.25, std=2.577, min=19.8, 25%=24.3, 50%=26.5, 75%=28.2, max=33.5

First 5 rows (sample)
- 2023-01-01 | South | population=520000 | clinic_visits=84 | next_day_clinic_visits=113 | ...
- 2023-01-02 | Central | population=610000 | clinic_visits=113 | next_day_clinic_visits=127 | ...
- 2023-01-03 | West | population=500000 | clinic_visits=127 | next_day_clinic_visits=128 | ...
- 2023-01-04 | East | population=480000 | clinic_visits=128 | next_day_clinic_visits=106 | ...
- 2023-01-05 | North | population=420000 | clinic_visits=106 | next_day_clinic_visits=111 | ...

Notes / potential issues
- A few numeric columns have small numbers of missing values (pm25, no2, avg_wait_time, pollen, next_day_clinic_visits). Decide on imputation or row-dropping depending on analysis.
- date appears suitable for time-series use but should be parsed to a date type.
- Several numeric columns (visits_per_10k, admission_rate, pct_elderly/children) are already normalized/fractional — confirm units if needed.

Would you like me to do any of the following next?
- Parse date and show a time-series plot of clinic_visits (or next_day_clinic_visits).
- Correlation matrix (numeric cols) and highlight top predictors of next_day_clinic_visits.
- Show value distributions / histograms and detect outliers.
- Impute missing values (suggest method) and return a cleaned CSV.
- Fit a quick forecast model (e.g., simple regression or time-series) to predict next_day_clinic_visits.

Tell me which action you want and I’ll run it in the sandbox.`,
    contactEyebrow: "联系",
    contactTitle: "聊聊你的部署需求。",
    contactSubtitle: "如需访问、合作或支持，请直接联系，我们会尽快回复。",
    contactEmailTitle: "邮箱",
    chatTitle: "实时智能体控制台",
    chatSubtitle: "Pyodide + CPython，JSON 输出与图片预览",
    chatStatus: "在线",
    imagePanelTitle: "图片",
    imagePanelSubtitle: "生成的图表会显示在这里，并可下载。",
    imageDownload: "下载",
    sessionFilesTitle: "会话文件",
    sessionFilesSubtitlePrefix: "每次运行都会把上传文件复制到 ",
    sessionFilesSubtitleSuffix: "。",
    chooseFiles: "选择文件",
    upload: "上传",
    uploading: "上传中...",
    noFilesSelected: "未选择文件。",
    uploadedLabel: "已上传：",
    youLabel: "你",
    agentLabel: "智能体",
    chatInputPlaceholder: "让智能体执行一个任务",
    chatInputAria: "消息",
    send: "发送",
    sending: "发送中...",
    chatStarter: "你好！告诉我任务，我会在沙箱中运行。",
    chatErrorUnexpected: "服务器响应异常。",
    chatErrorStream: "流式返回出错。",
    chatNoOutput: "（无输出）",
    chatRequestFailed: "请求失败。",
    uploadFailed: "上传失败。",
    openImageAria: "打开 {name}",
    removeFileAria: "移除 {name}",
    closeImageAria: "关闭图片预览",
    loadingConsole: "正在加载控制台",
    loadingStatus: "加载中",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function formatTranslation(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}
