import api from './api';
import { Patient } from '../types';

export const patientService = {
  async getAll(search?: string): Promise<Patient[]> {
    const params = search ? { search } : {};
    const response = await api.get('/patients', { params });
    return response.data.patients;
  },

  async getById(id: string): Promise<Patient> {
    const response = await api.get(`/patients/${id}`);
    return response.data.patient;
  },

  async create(patient: Omit<Patient, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Patient> {
    const response = await api.post('/patients', patient);
    return response.data.patient;
  },

  async update(id: string, patient: Partial<Patient>): Promise<Patient> {
    const response = await api.put(`/patients/${id}`, patient);
    return response.data.patient;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },
};
