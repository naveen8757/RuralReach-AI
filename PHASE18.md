# RuralReach AI — Phase 18: AI Voice Tutor + Multilingual Speech

Phase 18 adds a browser-native voice learning layer designed for low-bandwidth environments.

## Features
- Speech-to-text in English, Tamil and Hindi using the browser Web Speech API where supported.
- Text question input for browsers without speech recognition.
- Local/offline fallback knowledge engine for selected study topics.
- Text-to-speech Read Aloud using SpeechSynthesis.
- Stop button for recognition and speech.
- Quick topic buttons.
- Recent question history stored locally.
- Dashboard shortcut and PWA shortcut.
- Service-worker cache updated to v18.

## Important prototype note
This is not a cloud generative AI voice model. Speech recognition and speech synthesis are browser capabilities, while the offline answer engine is a small local knowledge bank. A production version can connect authenticated requests to an LLM/STT/TTS service when connectivity is available.

## Run
```bash
node server/server.js
```
Open `http://localhost:8080/` and sign in. Then open **AI Voice Tutor** from the dashboard.

## Browser support
Speech recognition support varies by browser/device. If unavailable, typing and Read Aloud can still work where SpeechSynthesis is supported.
