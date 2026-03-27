import { z } from 'zod'

export const decisionModelSchema = z.object({
  name: z.string().min(1, 'Nama model wajib diisi.').max(150, 'Maksimal 150 karakter.'),
  descriptions: z.string().max(5000, 'Maksimal 5000 karakter.').optional().or(z.literal('')),
})
