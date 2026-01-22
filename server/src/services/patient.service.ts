import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { Patient } from '../types/index';
import { AppError } from '../middleware/errorHandler';

export class PatientService {
  async getAll(userId: string, search?: string): Promise<Patient[]> {
    let sql = `
      SELECT * FROM patients 
      WHERE deleted_at IS NULL
      ORDER BY last_name, first_name
    `;
    const params: any[] = [];

    if (search) {
      sql = `
        SELECT * FROM patients 
        WHERE deleted_at IS NULL
        AND (
          LOWER(first_name) LIKE LOWER($1) 
          OR LOWER(last_name) LIKE LOWER($1)
          OR LOWER(email) LIKE LOWER($1)
          OR phone LIKE $1
        )
        ORDER BY last_name, first_name
      `;
      params.push(`%${search}%`);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  async getById(id: string): Promise<Patient | null> {
    const result = await query(
      'SELECT * FROM patients WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(data: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Patient> {
    const id = uuidv4();
    const result = await query(
      `INSERT INTO patients (id, first_name, last_name, birth_date, phone, email, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [id, data.first_name, data.last_name, data.birth_date, data.phone || null, data.email || null, data.created_by]
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<Patient>): Promise<Patient> {
    const patient = await this.getById(id);
    if (!patient) {
      throw new AppError('Patient nicht gefunden.', 404);
    }

    const updateFields = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      values.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      values.push(data.last_name);
    }
    if (data.birth_date !== undefined) {
      updateFields.push(`birth_date = $${paramIndex++}`);
      values.push(data.birth_date);
    }
    if (data.phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(data.phone || null);
    }
    if (data.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(data.email || null);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE patients SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    const patient = await this.getById(id);
    if (!patient) {
      throw new AppError('Patient nicht gefunden.', 404);
    }

    // Soft delete
    await query(
      'UPDATE patients SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    );
  }
}

export const patientService = new PatientService();
