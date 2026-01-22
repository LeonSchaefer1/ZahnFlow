import { Router } from 'express';
import { noteController } from '../controllers/note.controller';
import { authenticateToken } from '../middleware/auth';
import { validate, noteSchema } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.put('/:id', validate(noteSchema), noteController.update.bind(noteController));
router.delete('/:id', noteController.delete.bind(noteController));

export default router;
