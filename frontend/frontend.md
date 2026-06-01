# Frontend — Launch setup

## Requirements

- Node.js
- Backend server running on `http://localhost:5000`

## Setup

Install dependencies:

```bash
npm install
```

## Launch

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Environment Variables

Create `.env` file in the `frontend/` folder if you need to change the backend URL:

```
VITE_API_URL=http://localhost:5000
```

## Notes

- The backend should run before starting the frontend
- Seed the database before first use: run `npm run seed` inside the `backend/` folder
- All users created by the seed have password: `Password1`
- Admin login: `admin@test.com` / `Password1`