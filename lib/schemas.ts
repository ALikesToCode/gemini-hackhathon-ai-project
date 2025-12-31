import { z } from "zod";

export const generatePackSchema = z.object({
  input: z.string().min(3),
  youtubeApiKey: z.string().min(10),
  geminiApiKey: z.string().min(10),
  models: z
    .object({
      pro: z.string().min(3),
      flash: z.string().min(3)
    })
    .optional(),
  examDate: z.string().optional(),
  vaultNotes: z.string().optional(),
  vaultDocIds: z.array(z.string()).optional(),
  researchSources: z.array(z.string().url()).optional(),
  options: z
    .object({
      examSize: z.number().int().min(3).max(50).default(10),
      formats: z.array(z.string()).default(["pdf", "csv"]),
      language: z.string().default("en"),
      includeResearch: z.boolean().default(false),
      includeCoach: z.boolean().default(true),
      includeAssist: z.boolean().default(false),
      simulateDelayMs: z.number().int().min(0).max(2500).default(250)
    })
    .optional()
});

export const submitAnswerSchema = z.object({
  packId: z.string().min(4),
  questionId: z.string().min(3),
  answer: z.string().min(1)
});

export const coachSchema = z.object({
  packId: z.string().min(4),
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
      })
    )
    .default([]),
  mode: z.enum(["coach", "viva", "assist"]).default("coach"),
  geminiApiKey: z.string().min(10),
  model: z.string().min(3)
});
