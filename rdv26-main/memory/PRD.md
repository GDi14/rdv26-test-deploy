# Rendezvous (RDV) — Interschool Festival Website

## Problem statement
Build an interschool festival website "Rendezvous / RDV" hosting 5 events with Y2K maximalist + 3D + terminal + scroll-animation aesthetic. Sections: Registration, Event Information, Contact. Inspiration: yutaabe.com, digital.tattooprojects.com, manifesto.itsoffbrand.com.

## Architecture
- React 19 + Tailwind + Framer Motion + react-fast-marquee + Sonner toasts
- FastAPI + MongoDB (Motor async)
- Single-page (`/`) layout: Navbar → Hero → Marquee → Events → Marquee → Registration → Marquee → Contact → Footer

## What's implemented (Feb 2026)
- Hero with chrome 3D elements, glitch title, stat strip
- 5 events (NEON CODEQUEST / CHROME RUNWAY / STATIC FREQUENCIES / GHOST PROTOCOL / TRIVIA OVERLOAD) in asymmetric bento grid
- Terminal MS-DOS-style registration form (POST /api/registrations)
- Contact section with FAQ accordion + contact form (POST /api/contact)
- Custom cursor, scanlines, scroll animations, marquee strips
- Backend endpoints: GET /api/events, GET /api/events/{id}, POST/GET /api/registrations, POST /api/contact, GET /api/stats

## Backlog (P1/P2)
- Email confirmation via Resend/SendGrid
- Admin dashboard for registrations
- Real Three.js/Spline 3D scene in hero (currently using floating chrome PNG)
- Sound design / hover SFX
- Per-event detail pages
- Live countdown timer to fest start

## Next tasks
- User review → polish based on feedback
