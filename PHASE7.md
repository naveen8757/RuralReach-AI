# RuralReach AI — Phase 7

## Professor Control Center
- Create, schedule, launch and delete classes
- Class codes and reusable classroom records
- Student management link
- Live classroom launch
- Attendance analytics
- Chat/download/lecture metrics
- Browser lecture recording in Live Classroom using MediaRecorder
- Existing Phase 6 WebRTC, camera, microphone and adaptive network quality retained

## Run
```bash
node server/server.js
```
Open http://localhost:8080/professor-control.html

## Recording
Open Live Class, start camera/microphone, click Record, then stop and download the WebM recording. The recording is created in the browser; production storage/upload should be added later.

## Production note
The current server is a development prototype. Production needs HTTPS, authentication/authorization, persistent database, cloud recording storage, TURN infrastructure and scalable media architecture.
