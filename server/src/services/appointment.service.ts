import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Appointment } from '../types/index';
import { AppError } from '../middleware/errorHandler';

export class AppointmentService {
  async getAll(startDate?: string, endDate?: string): Promise<Appointment[]> {
    let sql = `
      SELECT a.*, 
             p.first_name as patient_first_name, 
             p.last_name as patient_last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      sql += ` AND a.start_time >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND a.end_time <= $${paramIndex++}`;
      params.push(endDate);
    }

    sql += ' ORDER BY a.start_time';

    const result = await query(sql, params);
    return result.rows;
  }

  async getById(id: string): Promise<Appointment | null> {
    const result = await query(
      `SELECT a.*, 
              p.first_name as patient_first_name, 
              p.last_name as patient_last_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getByPatientId(patientId: string): Promise<Appointment[]> {
    const result = await query(
      `SELECT * FROM appointments 
       WHERE patient_id = $1 
       ORDER BY start_time DESC`,
      [patientId]
    );
    return result.rows;
  }

  async create(data: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    // Check for overlapping appointments
    const overlapCheck = await query(
      `SELECT id FROM appointments 
       WHERE user_id = $1 
       AND status != 'cancelled'
       AND (
         (start_time <= $2 AND end_time > $2)
         OR (start_time < $3 AND end_time >= $3)
         OR (start_time >= $2 AND end_time <= $3)
       )`,
      [data.user_id, data.start_time, data.end_time]
    );

    if (overlapCheck.rows.length > 0) {
      throw new AppError('Es existiert bereits ein Termin in diesem Zeitraum.', 409);
    }

    const id = uuidv4();
    const result = await query(
      `INSERT INTO appointments (id, patient_id, user_id, start_time, end_time, treatment, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [id, data.patient_id, data.user_id, data.start_time, data.end_time, data.treatment, data.notes || '', data.status || 'scheduled']
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const appointment = await this.getById(id);
    if (!appointment) {
      throw new AppError('Termin nicht gefunden.', 404);
    }

    const updateFields = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.patient_id !== undefined) {
      updateFields.push(`patient_id = $${paramIndex++}`);
      values.push(data.patient_id);
    }
    if (data.start_time !== undefined) {
      updateFields.push(`start_time = $${paramIndex++}`);
      values.push(data.start_time);
    }
    if (data.end_time !== undefined) {
      updateFields.push(`end_time = $${paramIndex++}`);
      values.push(data.end_time);
    }
    if (data.treatment !== undefined) {
      updateFields.push(`treatment = $${paramIndex++}`);
      values.push(data.treatment);
    }
    if (data.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }
    if (data.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    const appointment = await this.getById(id);
    if (!appointment) {
      throw new AppError('Termin nicht gefunden.', 404);
    }

    await query('DELETE FROM appointments WHERE id = $1', [id]);
  }
}

export const appointmentService = new AppointmentService();
