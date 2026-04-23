# Schulmanager Backend

This backend is the first MVP foundation for a larger school manager and now uses Firebase Auth plus Cloud Firestore.

## Included

- login endpoint with role payload
- role checks for teacher/admin endpoints
- class management
- student management
- attendance records
- classbook entries
- Firebase Auth for login and invite registration
- Cloud Firestore for users, invitations, classes, students, attendance, classbook and lessons
- SQL schema in `database/schema.sql`

## Bootstrap admin

- Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in `.env`
- On first start the backend creates the admin account in Firebase Auth and the matching Firestore profile

## Start

1. Open a terminal in `backend`
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill the Firebase values
4. Run `npm install`
5. Run `npm start`
6. Open `http://localhost:4000/api/health`

## Production notes

- Set `HOST=127.0.0.1` behind IIS or another reverse proxy
- Copy `.env.example` to `.env`
- Add a Firebase service account and your Firebase Web API key
- Restrict `ALLOWED_ORIGINS` to your public frontend domain
- Use HTTPS on the reverse proxy
- For Windows deployment see [../deploy/windows/README.md](c:/Users/Jannik/Documents/VS%20Code/deploy/windows/README.md)
- `APP_URL` and `ALLOWED_ORIGINS` should contain the exact deployed origin, for example `https://my-app.fly.dev`

## Main endpoints

- `POST /api/auth/login`
- `POST /api/auth/register-invite`
- `GET /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/users/invitations`
- `POST /api/users/invitations`
- `GET /api/lessons`
- `POST /api/lessons`
- `PATCH /api/lessons/:id`
- `DELETE /api/lessons/:id`
- `GET /api/classes`
- `POST /api/classes`
- `GET /api/students`
- `POST /api/students`
- `GET /api/attendance`
- `POST /api/attendance`
- `GET /api/classbook`
- `POST /api/classbook`

## Firebase notes

- Firestore collections are auto-seeded from `backend/data/seed-data.json` when `FIREBASE_SEED_ON_START=true` and the collection is still empty.
- The backend keeps the same REST API for the frontend, but auth tokens are now Firebase ID tokens.
- Invitations are stored in Firestore and registration creates users in Firebase Auth.
- The SQL files are the target relational model for the next migration to PostgreSQL.
- Admins now create invitation tokens with roles, and invited users complete registration themselves via `POST /api/auth/register-invite`.
- Admins can also edit and delete existing user accounts via `/api/users/:id`.
