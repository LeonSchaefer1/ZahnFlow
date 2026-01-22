import { Router } from 'express';
import { appointmentController } from '../controllers/appointment.controller';
import { authenticateToken } from '../middleware/auth';
import { validate, appointmentSchema } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', appointmentController.getAll.bind(appointmentController));
router.get('/:id', appointmentController.getById.bind(appointmentController));
router.post('/', validate(appointmentSchema), appointmentController.create.bind(appointmentController));
router.put('/:id', appointmentController.update.bind(appointmentController));
router.delete('/:id', appointmentController.delete.bind(appointmentController));

export default router;
