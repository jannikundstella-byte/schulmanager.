FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

CMD ["node", "src/server.js"]
