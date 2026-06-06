# Syncro

A collaborative task management application with real-time multi-user synchronization, kanban boards, focus timer, and role-based access control.

Built by **Jahidul Islam Zim**

---

## Features

- **Kanban Boards** — Drag-free task management with To Do, In Progress, In Review, and Completed columns
- **Real-time Sync** — Live updates across all users via Firestore
- **Focus Timer** — Pomodoro-style timer with presets, session history, and completion notifications
- **Role-based Access** — Admin and member roles; admin-only dashboard, user management, and board oversight
- **Invitation System** — Email-based invite flow with pending/accepted/revoked status tracking
- **Activity Log** — Real-time activity stream for each board
- **Notification System** — In-app toast notifications with sound chime and browser notification support
- **Member Management** — Add/remove members, promote to admin, authorize/deauthorize users

## Tech Stack

- **Frontend:** React, react-router-dom, Tailwind CSS, Motion (Framer Motion)
- **Backend:** Firebase (Firestore, Authentication, Hosting)
- **Build:** Vite

## Getting Started

```bash
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase project credentials:

```bash
cp .env.example .env
```

Required variables:
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.
- `VITE_ADMIN_EMAIL` — Bootstrap admin email

## Project Structure

```
src/
├── components/   # Reusable UI components (KanbanBoard, Header, Sidebar, etc.)
├── context/      # Auth context provider
├── layout/       # App layout with sidebar and header
├── lib/          # Firebase config, Firestore services
├── pages/        # Route pages (Dashboard, BoardDetail, FocusTimer, etc.)
└── types.js      # Shared constants (enums as const objects)
```

## License

MIT
