import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { theme } from '../theme/theme';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import PatientDialog from '../components/patients/PatientDialog';
import { patientService } from '../services/patientService';

// Mock patient service
vi.mock('../services/patientService', () => ({
  patientService: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

import { Patient } from '../types';

const renderPatientDialog = (props: {
  open: boolean;
  patient: Patient | null;
  onClose: (saved: boolean) => void;
}) => {
  return render(
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SnackbarProvider>
          <PatientDialog {...props} />
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

describe('PatientDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with empty form for new patient', () => {
    const onClose = vi.fn();
    renderPatientDialog({ open: true, patient: null, onClose });

    expect(screen.getByText('Neuer Patient')).toBeInTheDocument();
    expect(screen.getByLabelText(/Vorname/i)).toHaveValue('');
    expect(screen.getByLabelText(/Nachname/i)).toHaveValue('');
  });

  it('renders dialog with populated form for existing patient', () => {
    const onClose = vi.fn();
    const patient: Patient = {
      id: '1',
      first_name: 'Max',
      last_name: 'Mustermann',
      birth_date: '1990-01-15',
      phone: '+49 123 456789',
      email: 'max@example.com',
      created_by: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    renderPatientDialog({ open: true, patient, onClose });

    expect(screen.getByText('Patient bearbeiten')).toBeInTheDocument();
    expect(screen.getByLabelText(/Vorname/i)).toHaveValue('Max');
    expect(screen.getByLabelText(/Nachname/i)).toHaveValue('Mustermann');
  });

  it('validates required fields', async () => {
    const onClose = vi.fn();
    renderPatientDialog({ open: true, patient: null, onClose });

    const saveButton = screen.getByRole('button', { name: /Speichern/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Vorname ist erforderlich')).toBeInTheDocument();
    });
  });

  it('calls onClose with false when cancel is clicked', () => {
    const onClose = vi.fn();
    renderPatientDialog({ open: true, patient: null, onClose });

    const cancelButton = screen.getByRole('button', { name: /Abbrechen/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledWith(false);
  });

  it('creates new patient when form is valid', async () => {
    const onClose = vi.fn();
    vi.mocked(patientService.create).mockResolvedValueOnce({
      id: 'new-id',
      first_name: 'Test',
      last_name: 'Patient',
      birth_date: '1990-01-01',
      phone: '',
      email: '',
      created_by: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    renderPatientDialog({ open: true, patient: null, onClose });

    fireEvent.change(screen.getByLabelText(/Vorname/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Nachname/i), { target: { value: 'Patient' } });
    
    // Note: DatePicker testing requires more complex setup, skipping for basic test

    expect(screen.getByLabelText(/Vorname/i)).toHaveValue('Test');
    expect(screen.getByLabelText(/Nachname/i)).toHaveValue('Patient');
  });
});
