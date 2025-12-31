import { generateJson } from "./gemini";
import { ResearchReport, ResearchSource } from "./types";

const REPORT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
          excerpt: { type: "string" }
        },
        required: ["title", "url", "excerpt"]
      }
    }
  },
  required: ["summary", "sources"]
};

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  return match?.[1]?.trim() ?? "Source";
}

export async function fetchResearchSources(
  urls: string[],
  fallbackSources: ResearchSource[] = []
): Promise<ResearchSource[]> {
  const sources: ResearchSource[] = [];
  const fallbackMap = new Map<string, ResearchSource>(
    fallbackSources.map((source) => [source.url, source])
  );

  for (const url of urls) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const title = extractTitle(html);
      const text = stripHtml(html).slice(0, 2000);
      sources.push({ title, url, excerpt: text });
    } catch {
      const fallback = fallbackMap.get(url);
      sources.push(
        fallback ?? { title: "Source", url, excerpt: "Unavailable" }
      );
    }
  }

  return sources;
}

export async function searchResearchSources(
  query: string,
  apiKey: string,
  maxResults = 5
): Promise<ResearchSource[]> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey
    },
    body: JSON.stringify({ q: query })
  });

  if (!response.ok) {
    throw new Error("Research search failed");
  }

  const data = await response.json();
  const results = (data.organic ?? []).slice(0, maxResults);
  return results.map((item: { title?: string; link?: string; snippet?: string }) => ({
    title: item.title ?? "Source",
    url: item.link ?? "",
    excerpt: item.snippet ?? ""
  })).filter((item: ResearchSource) => item.url);
}

export async function buildResearchReport(
  courseTitle: string,
  sources: ResearchSource[],
  apiKey: string,
  model: string
): Promise<ResearchReport> {
  const prompt = `Summarize the following sources into a blueprint-style research memo for ${courseTitle}.
Focus on syllabus themes, exam expectations, and key topics. Cite sources in the summary.
Sources:\n${sources
    .map((source) => `Title: ${source.title}\nURL: ${source.url}\nExcerpt: ${source.excerpt}`)
    .join("\n\n")}
Return JSON matching the schema.`;

  const response = await generateJson<ResearchReport>({
    apiKey,
    model,
    prompt,
    config: {
      responseSchema: REPORT_SCHEMA,
      maxOutputTokens: 1200,
      temperature: 0.4,
      retry: { maxRetries: 2, baseDelayMs: 700 }
    }
  });

  return response;
}
