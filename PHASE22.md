# RuralReach AI — Phase 22
## QA & System Health Dashboard

Phase 22 adds a dedicated `system-test.html` page and `js/system-test.js` test runner.

### Automated checks
- 17 backend/API GET checks
- 22 frontend page availability checks
- localStorage/sessionStorage/IndexedDB/Cache Storage/Service Worker availability
- browser checks for online status, camera/microphone API, speech synthesis, speech recognition, WebRTC and PWA context
- pass/warning/fail summary
- demo readiness score
- diagnostics panel
- presenter checklist

### Run
```bash
node server/server.js
```
Open `http://localhost:8080/system-test.html` or use Student Dashboard → System Test Center.

### Important
The test center performs safe read-only HTTP checks. It does not create/delete real students, assignments, messages or projects. Camera/microphone and speech APIs are capability checks; permissions and real device behavior should still be manually tested once.
