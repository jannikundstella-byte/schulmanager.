# Fly.io deployment

Dieses Setup deployed Frontend und Backend als eine gemeinsame Fly.io App.

## Warum so

- nur eine Domain
- kein separates CORS-Problem
- Frontend spricht im Live-Betrieb automatisch mit `/api`
- deutlich einfacher fuer ein erstes Deployment

## Vor dem ersten Deploy

1. `flyctl` installieren und einloggen
2. In der Projektwurzel den App-Namen in [fly.toml](/c:/Users/Jannik/Documents/VS%20Code/fly.toml) anpassen
3. Ein starkes Secret setzen:

```powershell
fly secrets set TOKEN_SECRET="DEIN_LANGES_STARKES_SECRET" APP_URL="https://dein-app-name.fly.dev" ALLOWED_ORIGINS="https://dein-app-name.fly.dev"
```

## Deploy

```powershell
fly launch --no-deploy
fly deploy
```

Wenn `fly.toml` schon da ist, reicht spaeter:

```powershell
fly deploy
```

## Wichtige Dateien

- [fly.toml](/c:/Users/Jannik/Documents/VS%20Code/fly.toml)
- [Dockerfile](/c:/Users/Jannik/Documents/VS%20Code/Dockerfile)
- [frontend/config.js](/c:/Users/Jannik/Documents/VS%20Code/frontend/config.js)
- [backend/src/server.js](/c:/Users/Jannik/Documents/VS%20Code/backend/src/server.js)

## Hinweise

- Die Daten liegen aktuell noch in `backend/data/app-data.json`
- Das ist fuer Demo oder erste Tests okay, aber nicht ideal fuer echte Produktion
- Als naechsten grossen Schritt solltest du auf PostgreSQL wechseln
