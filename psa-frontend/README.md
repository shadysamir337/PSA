# ATS — Employee Portal (Frontend)

A React frontend for **About The Solution (ATS)** — a Professional Services Automation portal.
Employees only — sign in, then manage projects and tasks.

ATS is a Microsoft Dynamics 365 solutions partner serving the UAE, Egypt, and Saudi Arabia.
Website: https://aboutthesolution.com/

## Stack
- React 18 + Vite
- React Router v6
- Mock auth (localStorage) — **any non-empty email + password works**

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 — you'll land on the sign-in page.

## Project structure

```
src/
├── main.jsx
├── App.jsx                       # routes
├── context/AuthContext.jsx       # mock auth (localStorage)
├── components/
│   ├── ProtectedRoute.jsx
│   └── Layout.jsx                # sidebar + outlet
├── pages/
│   ├── SignIn.jsx                # ⭐ employee sign-in (entry point)
│   ├── Dashboard.jsx
│   ├── Projects.jsx
│   ├── Tasks.jsx                 # add/toggle/delete tasks
│   └── NotFound.jsx
└── styles/index.css
```

## Notes
- Sign-in accepts ANY credentials for now — wire up to a real auth/API later.
- Logout button is in the sidebar footer.
