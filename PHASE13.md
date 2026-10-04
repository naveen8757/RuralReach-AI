# Phase 13 — Real Lecture Text Grounding

- Professor Hub now accepts `.txt`, `.vtt`, `.srt`, or `.md` lecture transcripts in addition to PDFs.
- The central server extracts text from uploaded PDFs using a dependency-free built-in parser for common PDF text streams.
- Text is normalized and split into overlapping chunks.
- `/api/lectures/:id/context?q=...` retrieves the most relevant chunks using lightweight keyword scoring.
- Lecture AI shows grounding status, chunk count, source snippets, and answers using retrieved evidence.
- `/api/lectures/:id/reindex` can re-extract notes/transcript text.

This is local retrieval/RAG-style grounding, not a generative model. A production deployment can pass retrieved chunks to a hosted or local LLM while keeping the same retrieval layer.
