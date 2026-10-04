# RuralReach AI

RuralReach AI is a lightweight remote-classroom platform designed for rural colleges and low-bandwidth environments.

## Main features

- Student and professor dashboards
- Remote/live classroom interface
- Lecture and note access
- Offline learning support / service worker
- Assignments and examinations
- AI learning and assistant interfaces
- Career and project-learning modules
- Network-aware classroom experience
- Phase 22 System Test Center
- Node.js backend for local/API functionality

## Project structure

- `index.html` — landing page
- `login.html` — login page
- `dashboard.html` — student dashboard
- `teacher-dashboard.html` — professor dashboard
- `classroom.html` — classroom interface
- `system-test.html` — Phase 22 system test center
- `css/` — styles
- `js/` — frontend JavaScript
- `data/` — static application data
- `server/` — Node.js backend
- `manifest.json` / `sw.js` — PWA/offline support

## Run locally

From the project root:

```bash
cd server
npm install
node server.js
```

Then open the URL printed by the server (the project currently uses port 8080).

## GitHub Pages note

GitHub Pages can host the static frontend, but it cannot run the Node.js backend. Backend/API features require a separate Node.js-capable hosting service.

## Demo authentication

This repository is a prototype. Any demo credentials included by the original project are for demonstration only and must not be treated as production authentication.

## Deployment

1. Create a GitHub repository named `RuralReach-AI`.
2. Upload/push the contents of this folder.
3. For frontend-only deployment, enable GitHub Pages from the repository's Pages settings.
4. For full functionality, deploy `server/` to a Node.js hosting provider and update frontend API configuration to that backend URL.

## Prototype status

This is a college/hackathon prototype. Production deployment would require secure authentication, HTTPS, database persistence, authorization, validation, monitoring, and proper secrets management.
