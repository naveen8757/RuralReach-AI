# Phase 14 — Adaptive Learning & Progress Intelligence

Added a student Smart Learning page with diagnostic quiz, subject mastery map, personalized recommendations, daily study plan, offline-first learning events, and central sync endpoints.

New page: `/smart-learning.html`

New API endpoints:
- POST `/api/learning/event`
- GET `/api/learning/summary?studentId=...`
- GET `/api/learning/class-summary`

This is a local adaptive-learning prototype. The quiz engine and recommendations are deterministic/local; production can connect the same event model to an LLM/RAG and a real analytics database.
