export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  phone: string;
  email: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  treatment: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  patient_first_name?: string;
  patient_last_name?: string;
}

export interface PatientNote {
  id: string;
  patient_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}
