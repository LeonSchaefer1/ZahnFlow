import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validierungsfehler',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      next(error);
    }
  };
};

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich')
});

export const patientSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat (YYYY-MM-DD)'),
  phone: z.string().max(30).optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal(''))
});

export const appointmentSchema = z.object({
  patient_id: z.string().uuid('Ungültige Patienten-ID'),
  start_time: z.string().datetime('Ungültiges Startzeit-Format'),
  end_time: z.string().datetime('Ungültiges Endzeit-Format'),
  treatment: z.string().min(1, 'Behandlung ist erforderlich').max(200),
  notes: z.string().max(2000).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional()
});

export const noteSchema = z.object({
  content: z.string().min(1, 'Notiz darf nicht leer sein').max(10000)
});
