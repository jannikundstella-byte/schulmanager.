# Windows Deployment

Diese Dateien bereiten das Projekt fuer einen privaten Windows-Server vor.

## Zielbild

- `IIS` liefert die Dateien aus `frontend` aus
- `backend` laeuft als Windows-Dienst mit `NSSM`
- `IIS + ARR` leitet `/api` an `http://127.0.0.1:4000` weiter
- TLS endet an IIS

## Backend

1. Kopiere `backend/.env.example` nach `backend/.env`
2. Setze mindestens:
   - `HOST=127.0.0.1`
   - `PORT=4000`
   - `TOKEN_SECRET=<starkes-geheimes-passwort>`
   - `APP_URL=https://deine-domain.tld`
   - `ALLOWED_ORIGINS=https://deine-domain.tld`
   - `TRUST_PROXY=true`
3. Fuehre in `backend` aus:
   - `npm install`
4. Installiere den Windows-Dienst mit [install-nssm-backend.ps1](/c:/Users/Jannik/Documents/VS%20Code/deploy/windows/install-nssm-backend.ps1)

## Frontend

1. Kopiere `frontend` in den IIS-Webroot
2. Ersetze `frontend/config.js` durch [frontend-config.production.js](/c:/Users/Jannik/Documents/VS%20Code/deploy/windows/frontend-config.production.js)
3. Passe `apiBase` auf deine oeffentliche Domain an
4. Stelle sicher, dass das IIS URL Rewrite Modul installiert ist

## IIS Reverse Proxy

Einrichtung in IIS:

1. `Application Request Routing` installieren
2. Serverweit `Proxy` aktivieren
3. Eine Regel anlegen:
   - Muster: `^api/(.*)`
   - Ziel: `http://127.0.0.1:4000/api/{R:1}`
4. Zusatzziele:
   - `http://127.0.0.1:4000/api/health` muss intern erreichbar sein
   - extern nur `443` freigeben

## Sicherheitsminimum

- Niemals die Demo-Passwoerter produktiv lassen
- Neues `TOKEN_SECRET` setzen
- HTTPS erzwingen
- Windows und Node regelmaessig updaten
- taegliche Backups fuer `backend/data/app-data.json`
- spaeter auf PostgreSQL umstellen
