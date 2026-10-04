# RuralReach AI — Phase 4: Tamil Nadu Central Lecture Network

## What was added
- Local Node.js central server with REST API
- Professor lecture sync from browser to central server
- Student-account sync
- Central lecture metadata and media storage
- Remote lecture discovery in Lecture Network
- Remote streaming from central server
- Save remote lecture media into browser Cache Storage for offline use
- Download event tracking
- Server health and network statistics endpoints

## Run
Open terminal inside `RuralReach-AI`:

```bash
node server/server.js
```

Then open:

`http://localhost:8080`

Use Professor Hub → publish content → Central Network Sync → Sync Lectures.

## Demo flow
Professor → central server → Lecture Network → student → Save Offline → offline player.

## Production upgrade
For actual Tamil Nadu-wide deployment, replace the local Node server with hosted infrastructure, a real database/object storage/CDN, HTTPS, secure authentication, role-based access, resumable uploads, storage quotas and monitoring.
