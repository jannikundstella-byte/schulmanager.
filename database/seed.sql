INSERT INTO roles (name) VALUES
  ('admin'),
  ('teacher'),
  ('student'),
  ('parent');

-- Demo passwords should be hashed before production use.
INSERT INTO users (id, email, password_hash, role_id, first_name, last_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@schule.local', 'demo-hash', 1, 'Alex', 'Admin'),
  ('22222222-2222-2222-2222-222222222222', 'lehrer@schule.local', 'demo-hash', 2, 'Mina', 'Lehrer'),
  ('33333333-3333-3333-3333-333333333333', 'schueler@schule.local', 'demo-hash', 3, 'Jannik', 'Anders');

INSERT INTO school_classes (id, name, grade_level, teacher_user_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '8A', 8, '22222222-2222-2222-2222-222222222222');

INSERT INTO students (id, user_id, class_id, first_name, last_name) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Jannik', 'Anders');
