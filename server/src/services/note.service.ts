import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { PatientNote } from '../types/index';
import { AppError } from '../middleware/errorHandler';

export class NoteService {
  async getByPatientId(patientId: string): Promise<PatientNote[]> {
    const result = await query(
      `SELECT n.*, u.name as author_name
       FROM patient_notes n
       JOIN users u ON n.user_id = u.id
       WHERE n.patient_id = $1
       ORDER BY n.created_at DESC`,
      [patientId]
    );
    return result.rows;
  }

  async getById(id: string): Promise<PatientNote | null> {
    const result = await query(
      'SELECT * FROM patient_notes WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data: Omit<PatientNote, 'id' | 'created_at' | 'updated_at'>): Promise<PatientNote> {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO patient_notes (id, patient_id, user_id, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [id, data.patient_id, data.user_id, data.content]
    );
    return result.rows[0];
  }

  async update(id: string, userId: string, content: string): Promise<PatientNote> {
    const note = await this.getById(id);
    if (!note) {
      throw new AppError('Notiz nicht gefunden.', 404);
    }

    // Only the author can edit the note
    if (note.user_id !== userId) {
      throw new AppError('Sie können nur Ihre eigenen Notizen bearbeiten.', 403);
    }

    const result = await query(
      `UPDATE patient_notes SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [content, id]
    );
    return result.rows[0];
  }

  async delete(id: string, userId: string): Promise<void> {
    const note = await this.getById(id);
    if (!note) {
      throw new AppError('Notiz nicht gefunden.', 404);
    }

    // Only the author can delete the note
    if (note.user_id !== userId) {
      throw new AppError('Sie können nur Ihre eigenen Notizen löschen.', 403);
    }

    await query('DELETE FROM patient_notes WHERE id = $1', [id]);
  }
}

export const noteService = new NoteService();
