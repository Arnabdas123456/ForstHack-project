import { z } from "zod"

export const createLibraryItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  theme: z.string().trim().max(120).optional(),
  mood: z.string().trim().max(80).optional(),
  songName: z.string().trim().max(255).optional(),
  thumbnailUrl: z.string().trim().url("Invalid thumbnail URL").max(1024).optional(),
  videoUrl: z.string().trim().url("Invalid video URL").max(1024),
  rating: z.number().int().min(0).max(5).optional(),
})

export type CreateLibraryItemInput = z.infer<typeof createLibraryItemSchema>
