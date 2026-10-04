RURALREACH AI - ENHANCED HACKATHON PROTOTYPE

Quick start:
1. Extract the ZIP.
2. Open the RuralReach-AI folder in VS Code.
3. Use Live Server.
4. Open index.html with Live Server.

Demo flow:
Home -> Dashboard -> Live Class -> Simulate Weak Network -> Go Offline
-> Lectures -> Open Lecture -> Update Progress -> Assignments -> AI Tutor.

New in this version:
- Rich live online classroom UI
- Smart Saver / Low Data / Audio + Slides modes
- Simulated bandwidth adaptation
- Data usage and savings indicators
- Visible featured lectures
- Full assignment center
- Offline assignment progress
- Lecture player + local notes
- English/Tamil/Hindi local AI responses
- Service-worker offline cache
- Responsive mobile UI

Important:
The live video, bandwidth figures and AI responses are prototype simulations for a hackathon demo.
For a production deployment, connect real WebRTC/P2P streaming, a backend, real lecture media and an actual AI model.


PHASE 1 - NETWORK INTELLIGENCE
- Automatic online/offline detection using browser events.
- Uses Network Information API when supported (effectiveType, downlink, RTT).
- Automatically selects strong, weak, or offline classroom mode.
- Existing manual network simulator is preserved for demonstrations.
- Network measurements depend on browser/device support and are approximate.


PHASE 2 - TAMIL NADU FACULTY NETWORK
- login.html provides Student/Professor demo roles.
- teacher-dashboard.html lets a professor publish video and notes into a local IndexedDB content store.
- lectures.html now includes a Tamil Nadu Lecture Network and district filter.
- Published video/notes can be marked for offline learning on the same device.
- IMPORTANT: this phase is a working local prototype. To distribute lectures to students across Tamil Nadu on different devices, connect the same UI to a cloud backend/object storage/CDN and authentication.

PHASE 4 - CENTRAL TAMIL NADU NETWORK
Run `node server/server.js` inside the project folder and open http://localhost:8080. Professor Hub can sync lectures and students to the central development server. Students can discover remote lectures and save their media to browser Cache Storage for offline playback.

PHASE 5 LIVE CLASSROOM
- Open classroom.html for the live-class prototype.
- Professor camera/microphone use browser getUserMedia.
- Student photos appear in participants and attendance.
- Attendance and chat can sync through the central Node server when running.
- Network adaptation switches between 720p Adaptive, 360p Low Data, and Audio + Slides.
- Real multi-device WebRTC is a future phase; current media capture is local to the professor's browser.


PHASE 7 ROOT URL
Opening http://localhost:8080/ now loads login.html first. After login, users are routed to the appropriate dashboard. If an older page still appears, stop the server, restart it, then hard-refresh the browser (Ctrl+Shift+R). If an old service worker is cached, unregister the RuralReach service worker once in browser DevTools > Application > Service Workers, then reload.

Phase 10: Notifications & Communication — open communication.html for announcements, reminders, class alerts and messages.

PHASE 14
Open Smart Learning at /smart-learning.html. Start a diagnostic quiz to update the local mastery map, save today's plan, and test online/offline sync.
