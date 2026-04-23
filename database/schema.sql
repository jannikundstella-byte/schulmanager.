CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE school_classes (
  id UUID PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE,
  grade_level INTEGER NOT NULL,
  teacher_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  class_id UUID NOT NULL REFERENCES school_classes(id),
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  short_code VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES school_classes(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  teacher_user_id UUID NOT NULL REFERENCES users(id),
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 5),
  lesson_slot SMALLINT NOT NULL CHECK (lesson_slot BETWEEN 1 AND 12),
  room VARCHAR(40) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_records (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id),
  class_id UUID NOT NULL REFERENCES school_classes(id),
  record_date DATE NOT NULL,
  status VARCHAR(40) NOT NULL,
  is_excused BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classbook_entries (
  id UUID PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES school_classes(id),
  subject_id UUID REFERENCES subjects(id),
  entry_date DATE NOT NULL,
  topic TEXT NOT NULL,
  homework TEXT,
  teacher_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grade_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  weight NUMERIC(5,2) NOT NULL CHECK (weight >= 0)
);

CREATE TABLE grades (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  category_id UUID NOT NULL REFERENCES grade_categories(id),
  grade_value NUMERIC(4,2) NOT NULL,
  entered_by UUID NOT NULL REFERENCES users(id),
  grade_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id),
  entity_name VARCHAR(120) NOT NULL,
  entity_id UUID,
  action_name VARCHAR(80) NOT NULL,
  before_payload JSONB,
  after_payload JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
