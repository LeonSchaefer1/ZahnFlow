import { Response, NextFunction } from 'express';
import { appointmentService } from '../services/appointment.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class AppointmentController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { start, end } = req.query;
      const appointments = await appointmentService.getAll(
        start as string | undefined,
        end as string | undefined
      );
      res.json({ appointments });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await appointmentService.getById(req.params.id);
      if (!appointment) {
        res.status(404).json({ error: 'Termin nicht gefunden.' });
        return;
      }
      res.json({ appointment });
    } catch (error) {
      next(error);
    }
  }

  async getByPatientId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointments = await appointmentService.getByPatientId(req.params.patientId);
      res.json({ appointments });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await appointmentService.create({
        ...req.body,
        user_id: req.user!.userId
      });
      res.status(201).json({ appointment });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointment = await appointmentService.update(req.params.id, req.body);
      res.json({ appointment });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await appointmentService.delete(req.params.id);
      res.json({ message: 'Termin erfolgreich gelöscht.' });
    } catch (error) {
      next(error);
    }
  }
}

export const appointmentController = new AppointmentController();
