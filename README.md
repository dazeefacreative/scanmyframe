# Node.js Express + React Full-Stack Project

## Structure
- `server/`: Express backend (ESM modules)
- `client/`: React frontend (Vite)

## Getting Started

### 1. Install dependencies
```
cd server && npm install
cd ../client && npm install
```

### 2. Run development servers
- Start backend: `npm run dev` (in `server/`)
- Start frontend: `npm run dev` (in `client/`)

Frontend will proxy `/api/*` requests to backend at `localhost:4000`.

### 3. Build for production
- Frontend: `npm run build` (in `client/`)
- Backend: `npm run start` (in `server/`)

## Features
- ESM modules throughout
- Vite React client with Express API proxy
- Ready for development and extension
