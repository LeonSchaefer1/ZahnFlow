import api from './api';
import { Appointment } from '../types';

export const appointmentService = {
  async getAll(start?: string, end?: string): Promise<Appointment[]> {
    const params: Record<string, string> = {};
    if (start) params.start = start;
    if (end) params.end = end;
    const response = await api.get('/appointments', { params });
    return response.data.appointments;
  },

  async getById(id: string): Promise<Appointment> {
    const response = await api.get(`/appointments/${id}`);
    return response.data.appointment;
  },

  async getByPatientId(patientId: string): Promise<Appointment[]> {
    const response = await api.get(`/patients/${patientId}/appointments`);
    return response.data.appointments;
  },

  async create(appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    const response = await api.post('/appointments', appointment);
    return response.data.appointment;
  },

  async update(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    const response = await api.put(`/appointments/${id}`, appointment);
    return response.data.appointment;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },
};
