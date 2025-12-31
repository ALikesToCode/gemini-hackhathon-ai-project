import { getStoryboard, setStoryboard } from "./store";
import {
  Citation,
  Lecture,
  StoryboardLevel,
  StoryboardSpec,
  VisualReference,
  VisualSprite
} from "./types";

const SPEC_REGEX = /"playerStoryboardSpecRenderer"\s*:\s*\{"spec":"([^"]+)"\}/;

function decodeSpec(spec: string) {
  return spec
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");
}

function parseSpec(spec: string): StoryboardSpec | null {
  const clean = decodeSpec(spec);
  const parts = clean.split("|");
  if (parts.length < 2) return null;
  const baseUrl = parts[0];
  const levels: StoryboardLevel[] = [];

  parts.slice(1).forEach((entry, index) => {
    const fields = entry.split("#");
    if (fields.length < 8) return;
    const width = Number(fields[0]);
    const height = Number(fields[1]);
    const frameCount = Number(fields[2]);
    const columns = Number(fields[3]);
    const rows = Number(fields[4]);
    const intervalMs = Number(fields[5]);
    const name = fields[6];
    const signature = fields[7].replace(/^rs\$/, "");

    if ([width, height, frameCount, columns, rows].some((value) => Number.isNaN(value))) {
      return;
    }

    levels.push({
      width,
      height,
      frameCount,
      columns,
      rows,
      intervalMs,
      name,
      signature,
      level: index + 1,
      urlTemplate: baseUrl
    });
  });

  if (!levels.length) return null;
  return { baseUrl, levels };
}

export async function fetchStoryboardSpec(videoId: string): Promise<StoryboardSpec | null> {
  const cached = await getStoryboard(videoId);
  if (cached) return cached;

  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36"
      }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const match = html.match(SPEC_REGEX);
    if (!match?.[1]) return null;
    const spec = parseSpec(match[1]);
    if (spec) {
      await setStoryboard(videoId, spec);
    }
    return spec;
  } catch {
    return null;
  }
}

function parseTimestamp(timestamp: string) {
  const parts = timestamp.split(":").map((value) => Number(value));
  if (parts.some((value) => Number.isNaN(value))) return 0;
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }
  return parts[0] ?? 0;
}

function pickLevel(spec: StoryboardSpec): StoryboardLevel | null {
  const sorted = [...spec.levels].sort((a, b) => b.width - a.width);
  return sorted.find((level) => level.intervalMs > 0 && level.width >= 80) ?? sorted[0] ?? null;
}

function buildSprite(level: StoryboardLevel, timestampSeconds: number): VisualSprite {
  const frameIndex = Math.min(
    Math.floor((timestampSeconds * 1000) / Math.max(level.intervalMs, 1000)),
    Math.max(level.frameCount - 1, 0)
  );
  const framesPerSheet = level.columns * level.rows;
  const sheetIndex = Math.floor(frameIndex / framesPerSheet);
  const position = frameIndex % framesPerSheet;
  const col = position % level.columns;
  const row = Math.floor(position / level.columns);

  let spriteUrl = level.urlTemplate
    .replace("$L", String(level.level))
    .replace("$N", level.name.replace("$M", String(sheetIndex)));
  if (level.signature) {
    spriteUrl = `${spriteUrl}&rs=${level.signature}`;
  }

  return {
    spriteUrl,
    width: level.width,
    height: level.height,
    columns: level.columns,
    rows: level.rows,
    col,
    row
  };
}

function fallbackVisuals(
  lecture: Lecture,
  citations: Citation[]
): VisualReference[] {
  const baseUrl = `https://i.ytimg.com/vi/${lecture.videoId}/hqdefault.jpg`;
  return citations.slice(0, 2).map((item, index) => ({
    url: baseUrl,
    timestamp: item.timestamp,
    description: item.snippet ?? `Keyframe ${index + 1}`,
    kind: "thumbnail"
  }));
}

export async function buildVisualReferences(
  lecture: Lecture,
  citations: Citation[]
): Promise<VisualReference[]> {
  const spec = await fetchStoryboardSpec(lecture.videoId);
  if (!spec) {
    return fallbackVisuals(lecture, citations);
  }

  const level = pickLevel(spec);
  if (!level) {
    return fallbackVisuals(lecture, citations);
  }

  return citations.slice(0, 2).map((item, index) => {
    const seconds = parseTimestamp(item.timestamp);
    const sprite = buildSprite(level, seconds);
    return {
      url: sprite.spriteUrl,
      timestamp: item.timestamp,
      description: item.snippet ?? `Keyframe ${index + 1}`,
      kind: "storyboard",
      sprite
    };
  });
}
