// Mock the database
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../src/config/database';
import { AppointmentService } from '../src/services/appointment.service';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;

  beforeEach(() => {
    appointmentService = new AppointmentService();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all appointments', async () => {
      const mockAppointments = [
        {
          id: '1',
          patient_id: 'p1',
          user_id: 'u1',
          start_time: '2024-01-15T09:00:00Z',
          end_time: '2024-01-15T10:00:00Z',
          treatment: 'Kontrolle',
          patient_first_name: 'Max',
          patient_last_name: 'Mustermann',
        },
      ];

      mockedQuery.mockResolvedValueOnce({
        rows: mockAppointments,
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await appointmentService.getAll();

      expect(result).toEqual(mockAppointments);
    });

    it('should filter appointments by date range', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await appointmentService.getAll('2024-01-01', '2024-01-31');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('start_time >='),
        expect.arrayContaining(['2024-01-01', '2024-01-31'])
      );
    });
  });

  describe('create', () => {
    it('should create a new appointment', async () => {
      const newAppointment = {
        patient_id: 'p1',
        user_id: 'u1',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        treatment: 'Kontrolle',
        notes: '',
        status: 'scheduled' as const,
      };

      // First call: overlap check (no conflicts)
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Second call: insert
      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: 'new-uuid', ...newAppointment }],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await appointmentService.create(newAppointment);

      expect(result).toHaveProperty('id');
      expect(result.treatment).toBe('Kontrolle');
    });

    it('should throw error for overlapping appointments', async () => {
      const newAppointment = {
        patient_id: 'p1',
        user_id: 'u1',
        start_time: new Date('2024-01-15T09:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        treatment: 'Kontrolle',
        notes: '',
        status: 'scheduled' as const,
      };

      // Overlap check returns existing appointment
      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: 'existing-appointment' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await expect(appointmentService.create(newAppointment))
        .rejects.toThrow('Es existiert bereits ein Termin in diesem Zeitraum.');
    });
  });

  describe('update', () => {
    it('should update an existing appointment', async () => {
      const existingAppointment = {
        id: '1',
        patient_id: 'p1',
        treatment: 'Kontrolle',
      };

      // First call: getById
      mockedQuery.mockResolvedValueOnce({
        rows: [existingAppointment],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Second call: update
      mockedQuery.mockResolvedValueOnce({
        rows: [{ ...existingAppointment, treatment: 'Zahnreinigung' }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await appointmentService.update('1', { treatment: 'Zahnreinigung' });

      expect(result.treatment).toBe('Zahnreinigung');
    });

    it('should throw error for non-existent appointment', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(appointmentService.update('non-existent', { treatment: 'Test' }))
        .rejects.toThrow('Termin nicht gefunden.');
    });
  });

  describe('delete', () => {
    it('should delete an appointment', async () => {
      const existingAppointment = { id: '1' };

      // First call: getById
      mockedQuery.mockResolvedValueOnce({
        rows: [existingAppointment],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Second call: delete
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'DELETE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await expect(appointmentService.delete('1')).resolves.not.toThrow();
    });

    it('should throw error for non-existent appointment', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(appointmentService.delete('non-existent'))
        .rejects.toThrow('Termin nicht gefunden.');
    });
  });
});
