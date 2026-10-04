# RuralReach AI — Phase 5: Live Classroom

Phase 5 adds a professor-facing live classroom prototype:

- Browser camera preview with start/stop controls.
- Browser microphone controls with mute/unmute.
- Student participant cards using the photos stored by Professor Hub.
- Live attendance panel with present/not-joined status and click-to-toggle attendance.
- Attendance persistence in the browser plus optional central server sync.
- Class chat with local persistence and central server polling when the Node server is running.
- Network-aware classroom profiles: 720p Adaptive, 360p Low Data, and Audio + Slides.
- Automatic adaptation uses the browser Network Information API where available and online/offline events everywhere.
- Fullscreen professor video preview.

## Run

```bash
node server/server.js
```

Then open:

`http://localhost:8080/classroom.html`

Camera and microphone permissions work on `localhost` or HTTPS. The current browser implementation is a **live classroom UI/prototype**: the professor's camera/microphone are captured locally, while student participant tiles are represented by enrolled student profiles. Real multi-device video/audio requires a WebRTC media layer and a signaling service; this phase deliberately does not claim to provide that yet.
