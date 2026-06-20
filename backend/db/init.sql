-- =========================
-- Pediatric System - Schema
-- =========================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','DOCTOR','NURSE','LAB_TECHNICIAN')),
  specialization TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen TIMESTAMP NULL,
  profile_photo_url TEXT NULL,
  profile_photo_public_id TEXT NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_public_id TEXT NULL;

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  clinical_code VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  sex CHAR(1) NOT NULL CHECK (sex IN ('M','F')),
  birth_date DATE NOT NULL,
  guardian_name VARCHAR(120) NOT NULL,
  guardian_phone VARCHAR(30) NOT NULL,
  alt_phone VARCHAR(30) NULL,
  address TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE patients ADD COLUMN IF NOT EXISTS alt_phone VARCHAR(30) NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS deceased_at TIMESTAMP NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS death_note TEXT NULL;

-- VISITS
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'WAITING'
    CHECK (status IN ('WAITING','IN_TRIAGE','WAITING_DOCTOR','IN_CONSULTATION','FINISHED','CANCELLED')),
  arrival_time TIMESTAMP NOT NULL DEFAULT NOW(),
  doctor_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(30) NULL CHECK (priority IN ('URGENT','LESS_URGENT','NON_URGENT')),
  max_wait_minutes INTEGER NULL CHECK (max_wait_minutes IS NULL OR max_wait_minutes > 0),
  consultation_started_at TIMESTAMP NULL,
  consultation_ended_at TIMESTAMP NULL,
  visit_motive VARCHAR(40) NOT NULL DEFAULT 'MEDICAL_CONSULTATION',
  visit_motive_other TEXT NULL,
  visit_type VARCHAR(30) NOT NULL DEFAULT 'NEW_CONSULTATION',
  parent_visit_id INTEGER NULL REFERENCES visits(id) ON DELETE SET NULL,
  lab_return_kind VARCHAR(30) NULL,
  converted_to_consultation_at TIMESTAMP NULL,
  likely_diagnosis TEXT NULL,
  clinical_reasoning TEXT NULL,
  prescription_text TEXT NULL,
  disposition_plan VARCHAR(30) NULL,
  disposition_reason TEXT NULL,
  follow_up_when TEXT NULL,
  follow_up_instructions TEXT NULL,
  follow_up_return_if TEXT NULL,
  return_visit_date DATE NULL,
  return_visit_reason TEXT NULL,
  no_charge_chronic BOOLEAN NOT NULL DEFAULT FALSE,
  no_charge_reason TEXT NULL,
  hospital_status VARCHAR(30) NULL,
  vital_status VARCHAR(20) NULL,
  is_bedridden BOOLEAN NOT NULL DEFAULT FALSE,
  inpatient_unit TEXT NULL,
  inpatient_bed TEXT NULL,
  discharged_at TIMESTAMP NULL,
  doctor_questionnaire_json JSONB NULL,
  lab_requested BOOLEAN NOT NULL DEFAULT FALSE,
  lab_exam_type TEXT NULL,
  lab_tests TEXT NULL,
  lab_sample_type TEXT NULL,
  lab_sample_collected_at TIMESTAMP NULL,
  lab_result_text TEXT NULL,
  lab_result_json JSONB NULL,
  lab_result_status VARCHAR(30) NULL,
  lab_result_ready_at TIMESTAMP NULL,
  lab_patient_notified_at TIMESTAMP NULL,
  lab_patient_notified_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  lab_patient_notification_note TEXT NULL,
  cancel_reason TEXT NULL,
  cancelled_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMP NULL,
  nurse_discharge_note TEXT NULL,
  plan_accepted_at TIMESTAMP NULL,
  plan_accepted_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP NULL
);

ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_status_check;
ALTER TABLE visits ADD CONSTRAINT visits_status_check
  CHECK (status IN ('WAITING','IN_TRIAGE','WAITING_DOCTOR','IN_CONSULTATION','FINISHED','CANCELLED'));
ALTER TABLE visits ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE visits ADD COLUMN IF NOT EXISTS doctor_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS consultation_started_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS consultation_ended_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_motive VARCHAR(40) NOT NULL DEFAULT 'MEDICAL_CONSULTATION';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_motive_other TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS likely_diagnosis TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS clinical_reasoning TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS prescription_text TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS disposition_plan VARCHAR(30) NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS disposition_reason TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS follow_up_when TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS follow_up_instructions TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS follow_up_return_if TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS return_visit_date DATE NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS return_visit_reason TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS no_charge_chronic BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS no_charge_reason TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS hospital_status VARCHAR(30) NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS vital_status VARCHAR(20) NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS is_bedridden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS inpatient_unit TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS inpatient_bed TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS discharged_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS doctor_questionnaire_json JSONB NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_requested BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_exam_type TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_tests TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_sample_type TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_sample_collected_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_result_text TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_result_json JSONB NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_result_status VARCHAR(30) NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_result_ready_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_patient_notified_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_patient_notified_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_patient_notification_note TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS cancel_reason TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS cancelled_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS nurse_discharge_note TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS plan_accepted_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS plan_accepted_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_type VARCHAR(30) NOT NULL DEFAULT 'NEW_CONSULTATION';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS parent_visit_id INTEGER NULL REFERENCES visits(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS lab_return_kind VARCHAR(30) NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS converted_to_consultation_at TIMESTAMP NULL;

-- TRIAGE (1 por visita)
CREATE TABLE IF NOT EXISTS triage (
  id SERIAL PRIMARY KEY,
  visit_id INTEGER UNIQUE NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  temperature NUMERIC(4,1) NULL,
  heart_rate INTEGER NULL,
  respiratory_rate INTEGER NULL,
  oxygen_saturation INTEGER NULL,
  weight NUMERIC(6,2) NULL,
  chief_complaint TEXT NOT NULL,
  clinical_notes TEXT NULL,
  nurse_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  general_state TEXT NULL,
  needs_oxygen BOOLEAN NOT NULL DEFAULT FALSE,
  suspected_severe_dehydration BOOLEAN NOT NULL DEFAULT FALSE,
  excessive_lethargy BOOLEAN NOT NULL DEFAULT FALSE,
  difficulty_maintaining_sitting BOOLEAN NOT NULL DEFAULT FALSE,
  history_syncope_collapse BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE triage ADD COLUMN IF NOT EXISTS nurse_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE triage ADD COLUMN IF NOT EXISTS general_state TEXT NULL;
ALTER TABLE triage ADD COLUMN IF NOT EXISTS needs_oxygen BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE triage ADD COLUMN IF NOT EXISTS suspected_severe_dehydration BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE triage ADD COLUMN IF NOT EXISTS excessive_lethargy BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE triage ADD COLUMN IF NOT EXISTS difficulty_maintaining_sitting BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE triage ADD COLUMN IF NOT EXISTS history_syncope_collapse BOOLEAN NOT NULL DEFAULT FALSE;

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(clinical_code);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_priority ON visits(priority);
CREATE INDEX IF NOT EXISTS idx_visits_parent ON visits(parent_visit_id);
CREATE INDEX IF NOT EXISTS idx_visits_type ON visits(visit_type);
CREATE INDEX IF NOT EXISTS idx_triage_visit ON triage(visit_id);
