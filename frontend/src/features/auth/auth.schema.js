import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter.'),
  password: z.string().min(1, 'Password wajib diisi.'),
})

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Nama wajib diisi.'),
    username: z.string().min(3, 'Username minimal 3 karakter.'),
    password: z.string().min(6, 'Password minimal 6 karakter.'),
    confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi password harus sama.',
  })
