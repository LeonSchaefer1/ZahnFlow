import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Patient, Appointment, PatientNote } from '../types';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { noteService } from '../services/noteService';
import { useSnackbar } from '../contexts/SnackbarContext';
import PatientDialog from '../components/patients/PatientDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AppointmentDialog from '../components/calendar/AppointmentDialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<PatientNote | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

  const fetchPatientData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [patientData, appointmentsData, notesData] = await Promise.all([
        patientService.getById(id),
        appointmentService.getByPatientId(id),
        noteService.getByPatientId(id),
      ]);
      setPatient(patientData);
      setAppointments(appointmentsData);
      setNotes(notesData);
    } catch {
      showError('Fehler beim Laden der Patientendaten');
      navigate('/patients');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, showError]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  const handleDeletePatient = async () => {
    if (!patient) return;
    try {
      await patientService.delete(patient.id);
      showSuccess('Patient erfolgreich gelöscht');
      navigate('/patients');
    } catch {
      showError('Fehler beim Löschen des Patienten');
    }
  };

  const handleOpenNoteDialog = (note?: PatientNote) => {
    if (note) {
      setEditingNote(note);
      setNoteContent(note.content);
    } else {
      setEditingNote(null);
      setNoteContent('');
    }
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!id || !noteContent.trim()) return;
    setIsSavingNote(true);
    try {
      if (editingNote) {
        await noteService.update(editingNote.id, noteContent.trim());
        showSuccess('Notiz aktualisiert');
      } else {
        await noteService.create(id, noteContent.trim());
        showSuccess('Notiz hinzugefügt');
      }
      setNoteDialogOpen(false);
      fetchPatientData();
    } catch {
      showError('Fehler beim Speichern der Notiz');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await noteService.delete(noteId);
      showSuccess('Notiz gelöscht');
      fetchPatientData();
    } catch {
      showError('Fehler beim Löschen der Notiz');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Patientendaten werden geladen..." />;
  }

  if (!patient) {
    return <Typography>Patient nicht gefunden</Typography>;
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/patients')}
        sx={{ mb: 2 }}
      >
        Zurück zur Übersicht
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {patient.first_name} {patient.last_name}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item>
                  <Typography variant="body2" color="text.secondary">
                    Geburtsdatum
                  </Typography>
                  <Typography>
                    {format(new Date(patient.birth_date), 'dd.MM.yyyy', { locale: de })}
                  </Typography>
                </Grid>
                {patient.phone && (
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      Telefon
                    </Typography>
                    <Typography>{patient.phone}</Typography>
                  </Grid>
                )}
                {patient.email && (
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      E-Mail
                    </Typography>
                    <Typography>{patient.email}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
            <Box>
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Bearbeiten
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Löschen
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Übersicht" />
          <Tab label={`Termine (${appointments.length})`} />
          <Tab label={`Notizen (${notes.length})`} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Zusammenfassung</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h3" color="primary">{appointments.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Termine gesamt</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h3" color="primary">
                      {appointments.filter(a => a.status === 'scheduled').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Ausstehende Termine</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h3" color="primary">{notes.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Notizen</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAppointmentDialogOpen(true)}
              >
                Neuer Termin
              </Button>
            </Box>
            <List>
              {appointments.length === 0 ? (
                <Typography color="text.secondary">Keine Termine vorhanden</Typography>
              ) : (
                appointments.map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight="medium">{appointment.treatment}</Typography>
                            <Chip
                              size="small"
                              label={
                                appointment.status === 'scheduled' ? 'Geplant' :
                                appointment.status === 'completed' ? 'Abgeschlossen' : 'Abgesagt'
                              }
                              color={
                                appointment.status === 'scheduled' ? 'primary' :
                                appointment.status === 'completed' ? 'success' : 'error'
                              }
                            />
                          </Box>
                        }
                        secondary={
                          `${format(new Date(appointment.start_time), 'dd.MM.yyyy HH:mm', { locale: de })} - ${format(new Date(appointment.end_time), 'HH:mm', { locale: de })}`
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))
              )}
            </List>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenNoteDialog()}
              >
                Neue Notiz
              </Button>
            </Box>
            <List>
              {notes.length === 0 ? (
                <Typography color="text.secondary">Keine Notizen vorhanden</Typography>
              ) : (
                notes.map((note, index) => (
                  <React.Fragment key={note.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <Box>
                          <IconButton onClick={() => handleOpenNoteDialog(note)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteNote(note.id)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={note.content}
                        secondary={
                          `${note.author_name || 'Unbekannt'} - ${format(new Date(note.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}`
                        }
                        sx={{ pr: 8 }}
                      />
                    </ListItem>
                  </React.Fragment>
                ))
              )}
            </List>
          </CardContent>
        </TabPanel>
      </Card>

      <PatientDialog
        open={editDialogOpen}
        patient={patient}
        onClose={(saved) => {
          setEditDialogOpen(false);
          if (saved) fetchPatientData();
        }}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Patient löschen"
        message={`Möchten Sie den Patienten "${patient.first_name} ${patient.last_name}" wirklich löschen? Alle zugehörigen Termine und Notizen werden ebenfalls gelöscht.`}
        confirmText="Löschen"
        onConfirm={handleDeletePatient}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingNote ? 'Notiz bearbeiten' : 'Neue Notiz'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Notiz eingeben..."
            sx={{ mt: 1 }}
            disabled={isSavingNote}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)} disabled={isSavingNote}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSaveNote}
            variant="contained"
            disabled={!noteContent.trim() || isSavingNote}
          >
            {isSavingNote ? <CircularProgress size={24} /> : 'Speichern'}
          </Button>
        </DialogActions>
      </Dialog>

      <AppointmentDialog
        open={appointmentDialogOpen}
        appointment={null}
        initialDateRange={{ start: new Date(), end: new Date(Date.now() + 30 * 60 * 1000) }}
        patients={patient ? [patient] : []}
        onClose={(saved) => {
          setAppointmentDialogOpen(false);
          if (saved) fetchPatientData();
        }}
        preselectedPatient={patient}
      />
    </Box>
  );
};

export default PatientDetailPage;
