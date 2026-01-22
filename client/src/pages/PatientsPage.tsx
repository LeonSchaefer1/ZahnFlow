import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Patient } from '../types';
import { patientService } from '../services/patientService';
import { useSnackbar } from '../contexts/SnackbarContext';
import PatientDialog from '../components/patients/PatientDialog';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const fetchPatients = useCallback(async (searchTerm?: string) => {
    try {
      setIsLoading(true);
      const data = await patientService.getAll(searchTerm);
      setPatients(data);
    } catch {
      showError('Fehler beim Laden der Patienten');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    // Debounced search
    const timer = setTimeout(() => {
      fetchPatients(value || undefined);
    }, 300);
    return () => clearTimeout(timer);
  };

  const handleAddPatient = () => {
    setEditPatient(null);
    setDialogOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditPatient(patient);
    setDialogOpen(true);
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    try {
      await patientService.delete(patientToDelete.id);
      showSuccess('Patient erfolgreich gelöscht');
      fetchPatients(search || undefined);
    } catch {
      showError('Fehler beim Löschen des Patienten');
    } finally {
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  };

  const handleDialogClose = (saved: boolean) => {
    setDialogOpen(false);
    setEditPatient(null);
    if (saved) {
      fetchPatients(search || undefined);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => `${params.row.last_name}, ${params.row.first_name}`,
    },
    {
      field: 'birth_date',
      headerName: 'Geburtsdatum',
      width: 130,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return format(new Date(params.value), 'dd.MM.yyyy', { locale: de });
      },
    },
    {
      field: 'phone',
      headerName: 'Telefon',
      width: 150,
    },
    {
      field: 'email',
      headerName: 'E-Mail',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'actions',
      headerName: 'Aktionen',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Patient>) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => navigate(`/patients/${params.row.id}`)}
            title="Details anzeigen"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleEditPatient(params.row)}
            title="Bearbeiten"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            title="Löschen"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Patienten
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPatient}
        >
          Patient hinzufügen
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            placeholder="Suche nach Name, E-Mail oder Telefon..."
            value={search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </CardContent>
      </Card>

      <Card>
        <DataGrid
          rows={patients}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          autoHeight
          disableRowSelectionOnClick
          onRowDoubleClick={(params) => navigate(`/patients/${params.row.id}`)}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
          localeText={{
            noRowsLabel: 'Keine Patienten gefunden',
            MuiTablePagination: {
              labelRowsPerPage: 'Zeilen pro Seite:',
            },
          }}
        />
      </Card>

      <PatientDialog
        open={dialogOpen}
        patient={editPatient}
        onClose={handleDialogClose}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Patient löschen"
        message={`Möchten Sie den Patienten "${patientToDelete?.first_name} ${patientToDelete?.last_name}" wirklich löschen?`}
        confirmText="Löschen"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
};

export default PatientsPage;
