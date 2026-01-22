import api from './api';
import { PatientNote } from '../types';

export const noteService = {
  async getByPatientId(patientId: string): Promise<PatientNote[]> {
    const response = await api.get(`/patients/${patientId}/notes`);
    return response.data.notes;
  },

  async create(patientId: string, content: string): Promise<PatientNote> {
    const response = await api.post(`/patients/${patientId}/notes`, { content });
    return response.data.note;
  },

  async update(id: string, content: string): Promise<PatientNote> {
    const response = await api.put(`/notes/${id}`, { content });
    return response.data.note;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notes/${id}`);
  },
};
