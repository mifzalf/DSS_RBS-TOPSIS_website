import { z } from 'zod'

const usernameSchema = z
  .string()
  .min(3, 'Username minimal 3 karakter.')
  .max(50, 'Username maksimal 50 karakter.')
  .regex(/^\S+$/, 'Username tidak boleh menggunakan spasi.')

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password wajib diisi.'),
})

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi.'),
    username: usernameSchema,
    password: z.string().min(6, 'Password minimal 6 karakter.'),
    confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi password harus sama.',
  })
