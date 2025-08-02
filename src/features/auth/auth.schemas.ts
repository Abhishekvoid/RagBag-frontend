import { z } from "zod";


export const loginSchema = z.object({
  email: z.string().email("Invalid email address"), // Fixed: z.email() -> z.string().email()
  password: z.string().min(8, "Password must have at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(3, "Username must have at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password2: z
      .string()
      .min(8, "Password confirmation must be at least 8 characters"),
  })
  .refine((data) => data.password === data.password2, {
    // Fixed: == -> ===
    message: "Passwords do not match",
    path: ["password2"], // Fixed: points to correct field
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
