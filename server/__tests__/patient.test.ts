// Mock the database
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

import { query } from '../src/config/database';
import { PatientService } from '../src/services/patient.service';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('PatientService', () => {
  let patientService: PatientService;

  beforeEach(() => {
    patientService = new PatientService();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all patients', async () => {
      const mockPatients = [
        { id: '1', first_name: 'Max', last_name: 'Mustermann', birth_date: '1990-01-01' },
        { id: '2', first_name: 'Anna', last_name: 'Schmidt', birth_date: '1985-05-15' },
      ];

      mockedQuery.mockResolvedValueOnce({
        rows: mockPatients,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const result = await patientService.getAll('user-id');

      expect(result).toEqual(mockPatients);
      expect(mockedQuery).toHaveBeenCalled();
    });

    it('should filter patients by search term', async () => {
      const mockPatients = [
        { id: '1', first_name: 'Max', last_name: 'Mustermann', birth_date: '1990-01-01' },
      ];

      mockedQuery.mockResolvedValueOnce({
        rows: mockPatients,
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await patientService.getAll('user-id', 'Max');

      expect(result).toEqual(mockPatients);
      expect(mockedQuery).toHaveBeenCalledWith(expect.stringContaining('LIKE'), expect.arrayContaining(['%Max%']));
    });
  });

  describe('getById', () => {
    it('should return patient by id', async () => {
      const mockPatient = {
        id: '1',
        first_name: 'Max',
        last_name: 'Mustermann',
        birth_date: '1990-01-01',
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [mockPatient],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await patientService.getById('1');

      expect(result).toEqual(mockPatient);
    });

    it('should return null for non-existent patient', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await patientService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const newPatient = {
        first_name: 'Max',
        last_name: 'Mustermann',
        birth_date: '1990-01-01',
        phone: '+49 123 456789',
        email: 'max@example.com',
        created_by: 'user-id',
      };

      const createdPatient = {
        id: 'new-uuid',
        ...newPatient,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValueOnce({
        rows: [createdPatient],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await patientService.create(newPatient);

      expect(result).toEqual(createdPatient);
      expect(mockedQuery).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing patient', async () => {
      const existingPatient = {
        id: '1',
        first_name: 'Max',
        last_name: 'Mustermann',
        birth_date: '1990-01-01',
      };

      // First call: getById
      mockedQuery.mockResolvedValueOnce({
        rows: [existingPatient],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Second call: update
      mockedQuery.mockResolvedValueOnce({
        rows: [{ ...existingPatient, first_name: 'Maximilian' }],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await patientService.update('1', { first_name: 'Maximilian' });

      expect(result.first_name).toBe('Maximilian');
    });

    it('should throw error for non-existent patient', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(patientService.update('non-existent', { first_name: 'Test' }))
        .rejects.toThrow('Patient nicht gefunden.');
    });
  });

  describe('delete', () => {
    it('should soft delete a patient', async () => {
      const existingPatient = {
        id: '1',
        first_name: 'Max',
        last_name: 'Mustermann',
      };

      // First call: getById
      mockedQuery.mockResolvedValueOnce({
        rows: [existingPatient],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      // Second call: soft delete
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'UPDATE',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await expect(patientService.delete('1')).resolves.not.toThrow();
      expect(mockedQuery).toHaveBeenLastCalledWith(
        expect.stringContaining('deleted_at'),
        expect.arrayContaining(['1'])
      );
    });

    it('should throw error for non-existent patient', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(patientService.delete('non-existent'))
        .rejects.toThrow('Patient nicht gefunden.');
    });
  });
});
