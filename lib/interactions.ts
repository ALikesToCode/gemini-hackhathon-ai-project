import { getGenAIClient } from "./genaiClient";

type InteractionConfig = {
  temperature?: number;
  maxOutputTokens?: number;
};

function extractText(outputs?: Array<{ type?: string; text?: string }>) {
  if (!outputs?.length) return "";
  return outputs
    .filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("");
}

export async function generateInteractionText(options: {
  apiKey: string;
  model: string;
  prompt: string;
  config?: InteractionConfig;
  previousInteractionId?: string;
  store?: boolean;
}) {
  const ai = getGenAIClient(options.apiKey);
  const payload: Record<string, unknown> = {
    model: options.model as any,
    input: options.prompt,
    generation_config: {
      temperature: options.config?.temperature,
      max_output_tokens: options.config?.maxOutputTokens ?? 1024
    }
  };

  if (options.previousInteractionId) {
    payload.previous_interaction_id = options.previousInteractionId;
  }
  if (options.store !== undefined) {
    payload.store = options.store;
  }

  const interaction = await ai.interactions.create(payload as any);

  return extractText(interaction.outputs as Array<{ type?: string; text?: string }>);
}

export async function generateInteractionJson<T>(options: {
  apiKey: string;
  model: string;
  prompt: string;
  schema: Record<string, unknown>;
  config?: InteractionConfig;
  previousInteractionId?: string;
  store?: boolean;
}) {
  const ai = getGenAIClient(options.apiKey);
  const payload: Record<string, unknown> = {
    model: options.model as any,
    input: options.prompt,
    response_format: options.schema,
    response_mime_type: "application/json",
    generation_config: {
      temperature: options.config?.temperature,
      max_output_tokens: options.config?.maxOutputTokens ?? 2048
    }
  };

  if (options.previousInteractionId) {
    payload.previous_interaction_id = options.previousInteractionId;
  }
  if (options.store !== undefined) {
    payload.store = options.store;
  }

  const interaction = await ai.interactions.create(payload as any);

  const text = extractText(interaction.outputs as Array<{ type?: string; text?: string }>);
  if (!text) {
    throw new Error("Empty JSON response from Interactions API");
  }
  return JSON.parse(text) as T;
}
