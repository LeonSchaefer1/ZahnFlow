import { Response, NextFunction } from 'express';
import { patientService } from '../services/patient.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class PatientController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const patients = await patientService.getAll(req.user!.userId, search);
      res.json({ patients });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await patientService.getById(req.params.id);
      if (!patient) {
        res.status(404).json({ error: 'Patient nicht gefunden.' });
        return;
      }
      res.json({ patient });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await patientService.create({
        ...req.body,
        created_by: req.user!.userId
      });
      res.status(201).json({ patient });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = await patientService.update(req.params.id, req.body);
      res.json({ patient });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await patientService.delete(req.params.id);
      res.json({ message: 'Patient erfolgreich gelöscht.' });
    } catch (error) {
      next(error);
    }
  }
}

export const patientController = new PatientController();
