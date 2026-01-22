export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  phone: string;
  email: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  user_id: string;
  start_time: Date;
  end_time: Date;
  treatment: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export interface PatientNote {
  id: string;
  patient_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Express.Request {
  user?: JWTPayload;
}
