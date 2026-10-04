# RuralReach AI — Phase 6: Multi-Device Real-Time Classroom

## Added
- WebRTC peer-to-peer professor-to-student video/audio transport.
- HTTP polling signaling server for SDP offers/answers and ICE candidates.
- Student live classroom page with class-code join.
- Professor live network host control.
- Real remote professor video for students when WebRTC can establish a path.
- Optional student microphone/camera publishing.
- Central chat API remains available to both sides.
- Network intelligence UI continues to show strong/weak/offline profiles.
- Automatic signaling heartbeat and peer cleanup.

## Run
```bash
node server/server.js
```
Open `http://localhost:8080/login.html`.

Professor: `FAC001 / teacher123` then open `classroom.html` and click **Start Live Network Class**.

Student: log in with a student account, open `student-classroom.html`, enter `RR-2048`, then **Join Live Class**.

## Important
This is a working development WebRTC prototype. The server provides signaling, not media forwarding. Real deployment should add HTTPS, secure authentication, TURN infrastructure for restrictive networks, a production database, authorization, moderation, and proper privacy controls.
