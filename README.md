# Schulmanager

This repository now contains two layers:

- a local frontend prototype in [frontend/index.html](c:/Users/Jannik/Documents/VS%20Code/frontend/index.html)
- an MVP backend foundation in [backend/README.md](c:/Users/Jannik/Documents/VS%20Code/backend/README.md)

## Frontend

Open [frontend/index.html](c:/Users/Jannik/Documents/VS%20Code/frontend/index.html) in a browser.

The frontend still runs as a local static app, while the backend now persists shared data in Firebase.

## Backend MVP

The backend includes:

- login with Firebase Auth and role-based Firestore profiles
- classes
- students
- attendance
- classbook
- lessons
- SQL schema for a future PostgreSQL migration

See [backend/README.md](c:/Users/Jannik/Documents/VS%20Code/backend/README.md) for setup and API usage.

## Windows server deployment

The project now includes Windows deployment prep:

- configurable frontend API endpoint in [frontend/config.js](c:/Users/Jannik/Documents/VS%20Code/frontend/config.js)
- backend environment-based host and CORS settings
- IIS-friendly [frontend/web.config](c:/Users/Jannik/Documents/VS%20Code/frontend/web.config)
- Windows deployment notes in [deploy/windows/README.md](c:/Users/Jannik/Documents/VS%20Code/deploy/windows/README.md)

## GitHub upload

The repository now includes a root [`.gitignore`](c:/Users/Jannik/Documents/VS%20Code/.gitignore) so you can push it without:

- `backend/node_modules`
- `backend/.env`
- log files
