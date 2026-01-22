import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TodayIcon from '@mui/icons-material/Today';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { Appointment, Patient } from '../types';
import { appointmentService } from '../services/appointmentService';
import { patientService } from '../services/patientService';
import { useSnackbar } from '../contexts/SnackbarContext';
import AppointmentDialog from '../components/calendar/AppointmentDialog';
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from 'date-fns';
import { de } from 'date-fns/locale';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

// Custom styles for FullCalendar
const calendarStyles = {
  '& .fc': {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  '& .fc-theme-standard td, & .fc-theme-standard th': {
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  '& .fc-theme-standard .fc-scrollgrid': {
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  '& .fc-col-header-cell': {
    backgroundColor: '#f8fafb',
    padding: '12px 0',
    fontWeight: 500,
    color: '#424242',
    borderBottom: '2px solid rgba(0, 151, 167, 0.2)',
  },
  '& .fc-col-header-cell-cushion': {
    padding: '8px',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.5px',
  },
  '& .fc-daygrid-day': {
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 151, 167, 0.04)',
    },
  },
  '& .fc-daygrid-day-number': {
    padding: '8px 12px',
    color: '#616161',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  '& .fc-day-today': {
    backgroundColor: 'rgba(0, 151, 167, 0.08) !important',
    '& .fc-daygrid-day-number': {
      backgroundColor: '#0097A7',
      color: 'white',
      borderRadius: '50%',
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '4px',
    },
  },
  '& .fc-event': {
    borderRadius: '6px',
    border: 'none',
    padding: '2px 6px',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
  },
  '& .fc-timegrid-slot': {
    height: '48px',
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  '& .fc-timegrid-slot-label': {
    fontSize: '0.75rem',
    color: '#9e9e9e',
    fontWeight: 500,
  },
  '& .fc-timegrid-axis': {
    padding: '0 8px',
  },
  '& .fc-timegrid-now-indicator-line': {
    borderColor: '#D32F2F',
    borderWidth: '2px',
  },
  '& .fc-timegrid-now-indicator-arrow': {
    borderColor: '#D32F2F',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  '& .fc-highlight': {
    backgroundColor: 'rgba(0, 151, 167, 0.15)',
  },
  '& .fc-button': {
    display: 'none', // Hide default buttons, we use custom ones
  },
  '& .fc-toolbar-title': {
    display: 'none', // Hide default title, we use custom one
  },
};

const CalendarPage: React.FC = () => {
  const { showError } = useSnackbar();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<CalendarView>('timeGridWeek');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchAppointments = useCallback(async (start: Date, end: Date) => {
    try {
      setIsLoading(true);
      const data = await appointmentService.getAll(
        start.toISOString(),
        end.toISOString()
      );
      setAppointments(data);
    } catch {
      showError('Fehler beim Laden der Termine');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await patientService.getAll();
      setPatients(data);
    } catch {
      showError('Fehler beim Laden der Patienten');
    }
  }, [showError]);

  useEffect(() => {
    const now = new Date();
    fetchAppointments(
      startOfMonth(subMonths(now, 1)),
      endOfMonth(addMonths(now, 2))
    );
    fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: CalendarView | null) => {
    if (newView && calendarRef.current) {
      setCurrentView(newView);
      calendarRef.current.getApi().changeView(newView);
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
      setCurrentDate(calendarRef.current.getApi().getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
      setCurrentDate(calendarRef.current.getApi().getDate());
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      setCurrentDate(new Date());
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedAppointment(null);
    setSelectedDateRange({ start: selectInfo.start, end: selectInfo.end });
    setDialogOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const appointment = appointments.find(a => a.id === clickInfo.event.id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setSelectedDateRange(null);
      setDialogOpen(true);
    }
  };

  const handleDialogClose = (saved: boolean) => {
    setDialogOpen(false);
    setSelectedAppointment(null);
    setSelectedDateRange(null);
    if (saved) {
      const now = new Date();
      fetchAppointments(
        startOfMonth(subMonths(now, 1)),
        endOfMonth(addMonths(now, 2))
      );
    }
  };

  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setSelectedDateRange({ start: new Date(), end: new Date(Date.now() + 30 * 60 * 1000) });
    setDialogOpen(true);
  };

  const events: EventInput[] = appointments.map(appointment => ({
    id: appointment.id,
    title: `${appointment.patient_first_name || ''} ${appointment.patient_last_name || ''} - ${appointment.treatment}`,
    start: appointment.start_time,
    end: appointment.end_time,
    backgroundColor: 
      appointment.status === 'scheduled' ? '#0097A7' :
      appointment.status === 'completed' ? '#43A047' : '#E53935',
    borderColor:
      appointment.status === 'scheduled' ? '#00838F' :
      appointment.status === 'completed' ? '#2E7D32' : '#C62828',
  }));

  const getDateTitle = () => {
    if (currentView === 'dayGridMonth') {
      return format(currentDate, 'MMMM yyyy', { locale: de });
    } else if (currentView === 'timeGridWeek') {
      return format(currentDate, "'KW' w, MMMM yyyy", { locale: de });
    } else {
      return format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de });
    }
  };

  const todayAppointments = appointments.filter(a => {
    const today = new Date();
    const appointmentDate = new Date(a.start_time);
    return appointmentDate.toDateString() === today.toDateString() && a.status === 'scheduled';
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Terminkalender
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              icon={<TodayIcon />}
              label={`${todayAppointments.length} Termine heute`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAppointment}
          size="large"
          sx={{ 
            borderRadius: '12px',
            px: 3,
            boxShadow: '0 4px 14px rgba(0, 151, 167, 0.4)',
          }}
        >
          Neuer Termin
        </Button>
      </Box>

      {/* Calendar Controls */}
      <Card sx={{ mb: 2, borderRadius: '16px' }}>
        <CardContent sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              variant="outlined" 
              onClick={handlePrev}
              sx={{ minWidth: '40px', borderRadius: '10px' }}
            >
              <ChevronLeftIcon />
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleToday}
              sx={{ borderRadius: '10px' }}
            >
              Heute
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleNext}
              sx={{ minWidth: '40px', borderRadius: '10px' }}
            >
              <ChevronRightIcon />
            </Button>
            <Typography variant="h6" sx={{ ml: 2, fontWeight: 500, textTransform: 'capitalize' }}>
              {getDateTitle()}
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={currentView}
            exclusive
            onChange={handleViewChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                borderRadius: '10px',
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              },
            }}
          >
            <ToggleButton value="dayGridMonth">Monat</ToggleButton>
            <ToggleButton value="timeGridWeek">Woche</ToggleButton>
            <ToggleButton value="timeGridDay">Tag</ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card sx={{ borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
        <CardContent sx={{ p: 2, ...calendarStyles }}>
          {isLoading && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.8)',
                zIndex: 10,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            headerToolbar={false}
            locale="de"
            firstDay={1}
            events={events}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            weekends={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            slotDuration="00:15:00"
            height="auto"
            contentHeight={600}
            nowIndicator={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            dayHeaderFormat={{
              weekday: 'short',
              day: 'numeric',
            }}
            datesSet={(dateInfo) => setCurrentDate(dateInfo.start)}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 3, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', backgroundColor: '#0097A7' }} />
          <Typography variant="body2" color="text.secondary">Geplant</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', backgroundColor: '#43A047' }} />
          <Typography variant="body2" color="text.secondary">Abgeschlossen</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', backgroundColor: '#E53935' }} />
          <Typography variant="body2" color="text.secondary">Abgesagt</Typography>
        </Box>
      </Box>

      <AppointmentDialog
        open={dialogOpen}
        appointment={selectedAppointment}
        initialDateRange={selectedDateRange}
        patients={patients}
        onClose={handleDialogClose}
      />
    </Box>
  );
};

export default CalendarPage;
