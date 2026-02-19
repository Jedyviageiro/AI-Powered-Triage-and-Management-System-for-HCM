-- =========================
-- Pediatric System - Schema
-- =========================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','DOCTOR','NURSE')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  clinical_code VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  sex CHAR(1) NOT NULL CHECK (sex IN ('M','F')),
  birth_date DATE NOT NULL,
  guardian_name VARCHAR(120) NOT NULL,
  guardian_phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- VISITS
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'WAITING'
    CHECK (status IN ('WAITING','WAITING_DOCTOR','IN_CONSULTATION','FINISHED')),
  priority VARCHAR(30) NULL CHECK (priority IN ('URGENT','LESS_URGENT','NON_URGENT')),
  max_wait_minutes INTEGER NULL CHECK (max_wait_minutes IS NULL OR max_wait_minutes > 0),
  likely_diagnosis TEXT NULL,
  clinical_reasoning TEXT NULL,
  prescription_text TEXT NULL,
  disposition_plan VARCHAR(30) NULL,
  disposition_reason TEXT NULL,
  follow_up_when TEXT NULL,
  follow_up_instructions TEXT NULL,
  follow_up_return_if TEXT NULL,
  no_charge_chronic BOOLEAN NOT NULL DEFAULT FALSE,
  no_charge_reason TEXT NULL,
  plan_accepted_at TIMESTAMP NULL,
  plan_accepted_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP NULL
);

ALTER TABLE visits ADD COLUMN IF NOT EXISTS likely_diagnosis TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS clinical_reasoning TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS prescription_text TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS disposition_plan VARCHAR(30) NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS disposition_reason TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS follow_up_when TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS follow_up_instructions TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS follow_up_return_if TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS no_charge_chronic BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS no_charge_reason TEXT NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS plan_accepted_at TIMESTAMP NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS plan_accepted_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;

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
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(clinical_code);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_priority ON visits(priority);
CREATE INDEX IF NOT EXISTS idx_triage_visit ON triage(visit_id);
