import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create test user
  const userId = uuidv4();
  const passwordHash = await bcrypt.hash('ZahnFlow2024!', 12);

  try {
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', ['zahnarzt@zahnflow.de']);
    
    if (existingUser.rows.length === 0) {
      await query(
        `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [userId, 'zahnarzt@zahnflow.de', passwordHash, 'Dr. Max Mustermann']
      );
      console.log('✅ Test user created:');
      console.log('   Email: zahnarzt@zahnflow.de');
      console.log('   Passwort: ZahnFlow2024!');
    } else {
      console.log('ℹ️  Test user already exists');
    }

    // Create some sample patients
    const existingPatients = await query('SELECT COUNT(*) FROM patients');
    
    if (parseInt(existingPatients.rows[0].count) === 0) {
      const actualUserId = existingUser.rows.length > 0 ? existingUser.rows[0].id : userId;
      
      const samplePatients = [
        { first_name: 'Anna', last_name: 'Schmidt', birth_date: '1985-03-15', phone: '+49 171 1234567', email: 'anna.schmidt@email.de' },
        { first_name: 'Thomas', last_name: 'Müller', birth_date: '1978-07-22', phone: '+49 172 2345678', email: 'thomas.mueller@email.de' },
        { first_name: 'Julia', last_name: 'Weber', birth_date: '1992-11-08', phone: '+49 173 3456789', email: 'julia.weber@email.de' },
        { first_name: 'Michael', last_name: 'Fischer', birth_date: '1965-05-30', phone: '+49 174 4567890', email: 'michael.fischer@email.de' },
        { first_name: 'Sarah', last_name: 'Bauer', birth_date: '2001-09-12', phone: '+49 175 5678901', email: 'sarah.bauer@email.de' }
      ];

      for (const patient of samplePatients) {
        const patientId = uuidv4();
        await query(
          `INSERT INTO patients (id, first_name, last_name, birth_date, phone, email, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [patientId, patient.first_name, patient.last_name, patient.birth_date, patient.phone, patient.email, actualUserId]
        );
      }
      console.log('✅ Sample patients created');
    } else {
      console.log('ℹ️  Patients already exist, skipping seed');
    }

    console.log('✅ Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
