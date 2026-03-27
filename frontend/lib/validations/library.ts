import { z } from "zod"

export const mediaTypeSchema = z.enum(["video", "audio"])

export const createLibraryItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(1024).optional(),
  tags: z.string().trim().max(512).optional(),
  theme: z.string().trim().max(120).optional(),
  mood: z.string().trim().max(80).optional(),
  songName: z.string().trim().max(255).optional(),
  thumbnailUrl: z.string().trim().url("Invalid thumbnail URL").max(1024).optional(),
  mediaUrl: z.string().trim().url("Invalid media URL").max(1024).optional(),
  videoUrl: z.string().trim().url("Invalid video URL").max(1024).optional(),
  mediaType: mediaTypeSchema.optional(),
  rating: z.number().int().min(0).max(5).optional(),
  isInLibrary: z.boolean().optional(),
}).superRefine((value, ctx) => {
  if (!value.mediaUrl && !value.videoUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mediaUrl"],
      message: "Media URL is required",
    })
  }
})

export type CreateLibraryItemInput = z.infer<typeof createLibraryItemSchema>
