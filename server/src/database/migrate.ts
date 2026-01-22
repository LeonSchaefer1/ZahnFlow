import { query } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Patients table
  `CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
  )`,

  // Appointments table
  `CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    treatment VARCHAR(200) NOT NULL,
    notes TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Patient notes table
  `CREATE TABLE IF NOT EXISTS patient_notes (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Sessions table for tracking active logins (max 3 per user)
  `CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // Indexes for better query performance
  `CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name)`,
  `CREATE INDEX IF NOT EXISTS idx_patients_deleted ON patients(deleted_at)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(start_time, end_time)`,
  `CREATE INDEX IF NOT EXISTS idx_notes_patient ON patient_notes(patient_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`
];

async function runMigrations() {
  console.log('🔄 Running migrations...');
  
  for (const migration of migrations) {
    try {
      await query(migration);
      console.log('✅ Migration successful:', migration.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  console.log('✅ All migrations completed successfully!');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
