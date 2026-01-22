import { Router } from 'express';
import { patientController } from '../controllers/patient.controller';
import { noteController } from '../controllers/note.controller';
import { appointmentController } from '../controllers/appointment.controller';
import { authenticateToken } from '../middleware/auth';
import { validate, patientSchema, noteSchema } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Patient CRUD
router.get('/', patientController.getAll.bind(patientController));
router.get('/:id', patientController.getById.bind(patientController));
router.post('/', validate(patientSchema), patientController.create.bind(patientController));
router.put('/:id', validate(patientSchema), patientController.update.bind(patientController));
router.delete('/:id', patientController.delete.bind(patientController));

// Patient notes
router.get('/:patientId/notes', noteController.getByPatientId.bind(noteController));
router.post('/:patientId/notes', validate(noteSchema), noteController.create.bind(noteController));

// Patient appointments
router.get('/:patientId/appointments', appointmentController.getByPatientId.bind(appointmentController));

export default router;
