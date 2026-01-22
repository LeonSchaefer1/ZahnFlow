import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Autocomplete,
  MenuItem,
  Box,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Appointment, Patient } from '../../types';
import { appointmentService } from '../../services/appointmentService';
import { useSnackbar } from '../../contexts/SnackbarContext';
import ConfirmDialog from '../common/ConfirmDialog';

interface AppointmentDialogProps {
  open: boolean;
  appointment: Appointment | null;
  initialDateRange: { start: Date; end: Date } | null;
  patients: Patient[];
  onClose: (saved: boolean) => void;
  preselectedPatient?: Patient | null;
}

const TREATMENTS = [
  'Kontrolle',
  'Professionelle Zahnreinigung',
  'Füllung',
  'Wurzelbehandlung',
  'Extraktion',
  'Krone',
  'Brücke',
  'Implantat',
  'Bleaching',
  'Beratung',
  'Notfall',
  'Sonstiges',
];

const DURATIONS = [
  { value: 5, label: '5 Minuten' },
  { value: 10, label: '10 Minuten' },
  { value: 15, label: '15 Minuten' },
  { value: 20, label: '20 Minuten' },
  { value: 30, label: '30 Minuten' },
  { value: 45, label: '45 Minuten' },
  { value: 60, label: '1 Stunde' },
  { value: 90, label: '1,5 Stunden' },
  { value: 120, label: '2 Stunden' },
];

const AppointmentDialog: React.FC<AppointmentDialogProps> = ({
  open,
  appointment,
  initialDateRange,
  patients,
  onClose,
  preselectedPatient,
}) => {
  const { showSuccess, showError } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient: null as Patient | null,
    start_time: null as Date | null,
    duration: 30,
    treatment: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (appointment) {
        const patient = patients.find(p => p.id === appointment.patient_id) || null;
        const startTime = new Date(appointment.start_time);
        const endTime = new Date(appointment.end_time);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));
        setFormData({
          patient,
          start_time: startTime,
          duration: durationMinutes,
          treatment: appointment.treatment,
          notes: appointment.notes || '',
          status: appointment.status,
        });
      } else if (initialDateRange) {
        setFormData({
          patient: preselectedPatient || null,
          start_time: initialDateRange.start,
          duration: 30,
          treatment: '',
          notes: '',
          status: 'scheduled',
        });
      } else {
        setFormData({
          patient: preselectedPatient || null,
          start_time: new Date(),
          duration: 30,
          treatment: '',
          notes: '',
          status: 'scheduled',
        });
      }
      setErrors({});
    }
  }, [open, appointment, initialDateRange, patients, preselectedPatient]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.patient) newErrors.patient = 'Patient ist erforderlich';
    if (!formData.start_time) newErrors.start_time = 'Startzeit ist erforderlich';
    if (!formData.treatment) newErrors.treatment = 'Behandlung ist erforderlich';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const endTime = new Date(formData.start_time!.getTime() + formData.duration * 60 * 1000);
      const data = {
        patient_id: formData.patient!.id,
        start_time: formData.start_time!.toISOString(),
        end_time: endTime.toISOString(),
        treatment: formData.treatment,
        notes: formData.notes,
        status: formData.status,
      };

      if (appointment) {
        await appointmentService.update(appointment.id, data);
        showSuccess('Termin erfolgreich aktualisiert');
      } else {
        await appointmentService.create(data);
        showSuccess('Termin erfolgreich erstellt');
      }
      onClose(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || 'Fehler beim Speichern des Termins');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    setIsLoading(true);
    try {
      await appointmentService.delete(appointment.id);
      showSuccess('Termin erfolgreich gelöscht');
      onClose(true);
    } catch {
      showError('Fehler beim Löschen des Termins');
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {appointment ? 'Termin bearbeiten' : 'Neuer Termin'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                value={formData.patient}
                onChange={(_, newValue) => setFormData({ ...formData, patient: newValue })}
                options={patients}
                getOptionLabel={(option) => `${option.last_name}, ${option.first_name}`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Patient"
                    required
                    error={!!errors.patient}
                    helperText={errors.patient}
                  />
                )}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Startzeit"
                value={formData.start_time}
                onChange={(date) => setFormData({ ...formData, start_time: date })}
                disabled={isLoading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.start_time,
                    helperText: errors.start_time,
                  },
                }}
                ampm={false}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Dauer"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                disabled={isLoading}
                required
              >
                {DURATIONS.map((duration) => (
                  <MenuItem key={duration.value} value={duration.value}>
                    {duration.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Behandlung"
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                error={!!errors.treatment}
                helperText={errors.treatment}
                disabled={isLoading}
                required
              >
                {TREATMENTS.map((treatment) => (
                  <MenuItem key={treatment} value={treatment}>
                    {treatment}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {appointment && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                  disabled={isLoading}
                >
                  <MenuItem value="scheduled">Geplant</MenuItem>
                  <MenuItem value="completed">Abgeschlossen</MenuItem>
                  <MenuItem value="cancelled">Abgesagt</MenuItem>
                </TextField>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notizen"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={isLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {appointment && (
            <Box sx={{ flexGrow: 1 }}>
              <Button
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isLoading}
              >
                Löschen
              </Button>
            </Box>
          )}
          <Button onClick={() => onClose(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Speichern'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Termin löschen"
        message="Möchten Sie diesen Termin wirklich löschen?"
        confirmText="Löschen"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </>
  );
};

export default AppointmentDialog;
