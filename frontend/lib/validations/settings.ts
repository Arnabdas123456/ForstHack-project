import { z } from "zod"

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
})

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(72),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(72, "New password is too long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
