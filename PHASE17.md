# PHASE 17 — Offline Sync & Mobile Field Mode

RuralReach now includes a dedicated Offline Sync Center for low-connectivity environments.

## Features
- Offline action queue using localStorage
- Automatic retry when connectivity returns
- Manual Sync Now control
- Sync gateway: GET /api/sync/ping and POST /api/sync/batch
- Learning-event, assignment-submission and message synchronization
- Connection and effective network type display
- Smart / Low Data / Offline Only modes
- Cache/resource inspection and browser storage estimate
- PWA install prompt support
- Updated manifest with installable SVG icon
- Service worker cache v17

## Run
```powershell
node server/server.js
```
Open http://localhost:8080/ and login.
Student Dashboard → Offline Sync.

## Demo idea
Turn the browser offline, queue learning actions, then restore the connection and press Sync Now. The queued items should move to the central server.

## Production note
This is a prototype sync gateway. Production should use authenticated users, HTTPS, a real database, conflict/version handling, signed requests, and background sync/Push APIs where supported.
