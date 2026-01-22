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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Patient } from '../../types';
import { patientService } from '../../services/patientService';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { format, parseISO } from 'date-fns';

interface PatientDialogProps {
  open: boolean;
  patient: Patient | null;
  onClose: (saved: boolean) => void;
}

const PatientDialog: React.FC<PatientDialogProps> = ({ open, patient, onClose }) => {
  const { showSuccess, showError } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: null as Date | null,
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (patient) {
        setFormData({
          first_name: patient.first_name,
          last_name: patient.last_name,
          birth_date: patient.birth_date ? parseISO(patient.birth_date) : null,
          phone: patient.phone || '',
          email: patient.email || '',
        });
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          birth_date: null,
          phone: '',
          email: '',
        });
      }
      setErrors({});
    }
  }, [open, patient]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'Vorname ist erforderlich';
    if (!formData.last_name.trim()) newErrors.last_name = 'Nachname ist erforderlich';
    if (!formData.birth_date) newErrors.birth_date = 'Geburtsdatum ist erforderlich';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birth_date: formData.birth_date ? format(formData.birth_date, 'yyyy-MM-dd') : '',
        phone: formData.phone.trim(),
        email: formData.email.trim(),
      };

      if (patient) {
        await patientService.update(patient.id, data);
        showSuccess('Patient erfolgreich aktualisiert');
      } else {
        await patientService.create(data);
        showSuccess('Patient erfolgreich erstellt');
      }
      onClose(true);
    } catch {
      showError('Fehler beim Speichern des Patienten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {patient ? 'Patient bearbeiten' : 'Neuer Patient'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vorname"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              error={!!errors.first_name}
              helperText={errors.first_name}
              disabled={isLoading}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nachname"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              error={!!errors.last_name}
              helperText={errors.last_name}
              disabled={isLoading}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Geburtsdatum"
              value={formData.birth_date}
              onChange={(date) => setFormData({ ...formData, birth_date: date })}
              disabled={isLoading}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.birth_date,
                  helperText: errors.birth_date,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="E-Mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={!!errors.email}
              helperText={errors.email}
              disabled={isLoading}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
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
  );
};

export default PatientDialog;
