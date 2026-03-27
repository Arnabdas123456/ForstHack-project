import { z } from "zod"
import { moodSchema } from "@/lib/validations/ai-video"

export const songLanguageSchema = z.enum(["English", "Hindi", "Bengali"])
export const songStyleSchema = z.enum(["Romantic", "Happy", "Sad"])

export const createAiSongSchema = z.object({
  prompt: z.string().trim().min(3, "Prompt must be at least 3 characters").max(300),
  mood: moodSchema,
  language: songLanguageSchema.optional().default("English"),
  songStyle: songStyleSchema.optional().default("Romantic"),
  uploadToLibrary: z.boolean().optional().default(false),
})

export type CreateAiSongInput = z.infer<typeof createAiSongSchema>
