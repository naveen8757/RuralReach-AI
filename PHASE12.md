# RuralReach AI — Phase 12

## Lecture AI Companion
Phase 12 adds a lecture-grounded AI study page at `/lecture-ai.html`.

Features:
- Select a centrally published lecture.
- Load title, subject, professor, district, description and resource availability as the local context.
- Generate a concise study summary and revision checklist.
- Ask grounded questions in English, Tamil or Hindi.
- Generate local flashcards and a practice quiz.
- Cache the selected lecture context in localStorage for offline revision.
- Graceful fallback when the central server is unavailable.

This is a local/demo RAG-style experience, not a hosted LLM. It does not claim to read the binary contents of PDFs/videos. Production RAG can later add PDF text extraction, embeddings/vector search and a real AI model.
