import {
  createBrowserUseTask,
  getBrowserUseSession,
  getBrowserUseTask
} from "./browserUse";

type AssistToolResult = {
  label: string;
  content: string;
};

type BrowserUseOptions = {
  apiKey?: string;
  enabled?: boolean;
};

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractExpression(message: string) {
  const match = message.match(/(?:calc|calculate|compute|solve)\s*:\s*([0-9+*/().^%\\-\\s]+)/i);
  if (!match) return null;
  return match[1].trim();
}

function extractBrowserTask(message: string) {
  const match = message.match(/(?:^|\n)\s*browser\s*:\s*(.+)/i);
  if (!match) return null;
  return match[1].trim();
}

function safeEvaluate(expression: string) {
  if (!/^[0-9+*/().^%\\-\\s]+$/.test(expression)) {
    return null;
  }
  const normalized = expression.replace(/\^/g, "**");
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${normalized});`)();
    if (typeof result === "number" && Number.isFinite(result)) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchUrlSummary(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const text = stripHtml(html).slice(0, 1600);
    return `Source: ${url}\n${text}`;
  } catch {
    return `Source: ${url}\nUnavailable`;
  }
}

export async function runAssistTools(
  message: string,
  options?: { browserUse?: BrowserUseOptions }
) {
  const results: AssistToolResult[] = [];

  const expression = extractExpression(message);
  if (expression) {
    const value = safeEvaluate(expression);
    if (value !== null) {
      results.push({ label: "Calculated result", content: `${expression} = ${value}` });
    }
  }

  const urlMatches = message.match(/https?:\/\/[^\s]+/g) ?? [];
  if (urlMatches.length) {
    const summaries = await Promise.all(urlMatches.slice(0, 2).map(fetchUrlSummary));
    summaries.forEach((summary) =>
      results.push({ label: "Browser snapshot", content: summary })
    );
  }

  const browserTask = extractBrowserTask(message);
  if (options?.browserUse?.enabled && options.browserUse.apiKey && browserTask) {
    try {
      const task = await createBrowserUseTask({
        apiKey: options.browserUse.apiKey,
        task: browserTask,
        maxSteps: 40
      });
      const session = await getBrowserUseSession({
        apiKey: options.browserUse.apiKey,
        sessionId: task.sessionId
      });
      let status = "started";
      let output = "";
      try {
        const taskDetails = await getBrowserUseTask({
          apiKey: options.browserUse.apiKey,
          taskId: task.id
        });
        status = taskDetails.status;
        if (taskDetails.output) {
          output = taskDetails.output;
        }
      } catch {
        // ignore polling errors
      }

      results.push({
        label: "Browser Use task",
        content: [
          `Task: ${browserTask}`,
          `Task ID: ${task.id}`,
          `Session ID: ${task.sessionId}`,
          session.liveUrl ? `Live URL: ${session.liveUrl}` : "",
          `Status: ${status}`,
          output ? `Output: ${output}` : ""
        ]
          .filter(Boolean)
          .join("\n")
      });
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Browser Use task failed";
      results.push({
        label: "Browser Use task",
        content: `Failed to start: ${messageText}`
      });
    }
  }

  if (!results.length) return "";
  return results
    .map((result) => `${result.label}:\n${result.content}`)
    .join("\n\n");
}
