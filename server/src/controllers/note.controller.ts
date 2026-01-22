import { Response, NextFunction } from 'express';
import { noteService } from '../services/note.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class NoteController {
  async getByPatientId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notes = await noteService.getByPatientId(req.params.patientId);
      res.json({ notes });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await noteService.create({
        patient_id: req.params.patientId,
        user_id: req.user!.userId,
        content: req.body.content
      });
      res.status(201).json({ note });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await noteService.update(
        req.params.id,
        req.user!.userId,
        req.body.content
      );
      res.json({ note });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await noteService.delete(req.params.id, req.user!.userId);
      res.json({ message: 'Notiz erfolgreich gelöscht.' });
    } catch (error) {
      next(error);
    }
  }
}

export const noteController = new NoteController();
