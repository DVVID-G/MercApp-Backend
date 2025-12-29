import { z } from 'zod';

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').optional(),
  email: z.string().trim().email('Email inválido').optional(),
}).refine((data) => data.name !== undefined || data.email !== undefined, {
  message: 'Debe proporcionar al menos un campo para actualizar',
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente de la actual',
  path: ['newPassword'],
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

