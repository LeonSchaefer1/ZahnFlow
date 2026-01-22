import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Skeleton,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import { patientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { useSnackbar } from '../contexts/SnackbarContext';
import { format, startOfDay, endOfDay } from 'date-fns';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  upcomingAppointments: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useSnackbar();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patients, todayAppts, upcomingAppts] = await Promise.all([
          patientService.getAll(),
          appointmentService.getAll(
            startOfDay(new Date()).toISOString(),
            endOfDay(new Date()).toISOString()
          ),
          appointmentService.getAll(
            new Date().toISOString(),
            format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss'Z'")
          ),
        ]);

        setStats({
          totalPatients: patients.length,
          todayAppointments: todayAppts.filter(a => a.status === 'scheduled').length,
          upcomingAppointments: upcomingAppts.filter(a => a.status === 'scheduled').length,
        });
      } catch {
        showError('Fehler beim Laden der Dashboard-Daten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [showError]);

  const StatCard: React.FC<{
    title: string;
    value: number | undefined;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }> = ({ title, value, icon, color, onClick }) => (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {isLoading ? (
              <Skeleton width={60} height={40} />
            ) : (
              <Typography variant="h3" fontWeight="bold">
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Willkommen bei ZahnFlow - Ihrem CRM für die Zahnarztpraxis
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Patienten gesamt"
            value={stats?.totalPatients}
            icon={<PeopleIcon sx={{ color: 'white', fontSize: 32 }} />}
            color="#0097A7"
            onClick={() => navigate('/patients')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Termine heute"
            value={stats?.todayAppointments}
            icon={<EventIcon sx={{ color: 'white', fontSize: 32 }} />}
            color="#4FC3F7"
            onClick={() => navigate('/calendar')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Termine diese Woche"
            value={stats?.upcomingAppointments}
            icon={<CalendarMonthIcon sx={{ color: 'white', fontSize: 32 }} />}
            color="#388E3C"
            onClick={() => navigate('/calendar')}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Schnellzugriff
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Verwenden Sie die Navigation links, um Patienten zu verwalten oder den Terminkalender zu öffnen.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardPage;
