const API_BASE = "https://api.browser-use.com/api/v2";

export type BrowserUseTaskStatus = "started" | "paused" | "finished" | "stopped";

export type BrowserUseTask = {
  id: string;
  sessionId: string;
};

export type BrowserUseTaskView = {
  id: string;
  sessionId: string;
  status: BrowserUseTaskStatus;
  output?: string | null;
};

export type BrowserUseSessionView = {
  id: string;
  liveUrl?: string | null;
};

async function requestJson<T>(
  apiKey: string,
  url: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
) {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Browser-Use-API-Key": apiKey
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Browser Use API error (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function createBrowserUseTask(options: {
  apiKey: string;
  task: string;
  llm?: string;
  maxSteps?: number;
  startUrl?: string;
}): Promise<BrowserUseTask> {
  const body: Record<string, unknown> = {
    task: options.task,
    llm: options.llm ?? "browser-use-llm"
  };
  if (typeof options.maxSteps === "number") {
    body.maxSteps = options.maxSteps;
  }
  if (options.startUrl) {
    body.startUrl = options.startUrl;
  }

  return requestJson<BrowserUseTask>(options.apiKey, `${API_BASE}/tasks`, {
    method: "POST",
    body
  });
}

export async function getBrowserUseTask(options: {
  apiKey: string;
  taskId: string;
}): Promise<BrowserUseTaskView> {
  return requestJson<BrowserUseTaskView>(
    options.apiKey,
    `${API_BASE}/tasks/${options.taskId}`
  );
}

export async function getBrowserUseSession(options: {
  apiKey: string;
  sessionId: string;
}): Promise<BrowserUseSessionView> {
  return requestJson<BrowserUseSessionView>(
    options.apiKey,
    `${API_BASE}/sessions/${options.sessionId}`
  );
}
