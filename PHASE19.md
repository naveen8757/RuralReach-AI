# Phase 19 — AI Exam & Assessment Engine

RuralReach AI now includes an offline-first adaptive assessment center.

## Features
- Adaptive diagnostic and practice modes
- Programming, Digital Electronics and Embedded Systems question banks
- Difficulty moves up after correct answers and down after incorrect answers
- Automatic scoring and topic-level mastery
- AI-style revision recommendations based on weakest topics
- Results saved to localStorage for offline use
- Central server sync through `/api/assessment-results` when available
- Assessment result also enters the Phase 17 offline sync queue
- Student dashboard shortcut and PWA cache support

## Demo limitation
The question engine is a local rules-based adaptive system, not a hosted generative AI model. A production version could connect to an LLM/question-generation service with teacher-approved content and proper authentication.
