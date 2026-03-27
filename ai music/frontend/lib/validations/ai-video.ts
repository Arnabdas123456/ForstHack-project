import { z } from "zod"

export const moodSchema = z.enum(["Chill", "Focus", "Rain"])

export const createAiVideoSchema = z.object({
  prompt: z.string().trim().min(3, "Prompt must be at least 3 characters").max(300),
  mood: moodSchema,
  uploadToLibrary: z.boolean().optional().default(false),
})

export type CreateAiVideoInput = z.infer<typeof createAiVideoSchema>
