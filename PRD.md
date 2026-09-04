# Product Requirements Document (PRD)

## Shymaa Raouf Ali — Portfolio Website

| Field            | Value                                      |
|------------------|--------------------------------------------|
| **Version**      | 1.0.0                                      |
| **Date**         | September 2026                             |
| **Platform**     | Web (SPA)                                  |
| **Framework**    | Vue.js 3 (Composition API) + Vite          |
| **Owner**        | Shymaa Raouf Ali                           |
| **Status**       | Built — Ready for deployment               |

---

## 1. Overview

A premium, minimal portfolio website for Shymaa Raouf Ali — a Social Media Specialist and Content Creator based in Ismailia, Egypt, serving the Saudi market. The site functions as a digital storefront showcasing her skills, projects, certifications, and providing an AI-powered assistant to answer visitor questions in real time.

---

## 2. Objectives

| # | Objective | Success Metric |
|---|-----------|----------------|
| O1 | Present Shymaa's professional identity clearly | Visitor understands who she is within 5 seconds |
| O2 | Showcase work and capabilities | All 6 projects linked to live Instagram profiles |
| O3 | Generate inbound leads | Contact section with Email, LinkedIn, WhatsApp |
| O4 | Differentiate from generic portfolios | AI assistant answers questions autonomously |
| O5 | Serve Saudi market clients | Arabic font support, RTL-ready architecture |

---

## 3. Target Audience

| Segment | Description |
|---------|-------------|
| **Primary** | Saudi business owners looking for social media management |
| **Secondary** | Marketing agencies seeking freelance specialists |
| **Tertiary** | Recruiters and hiring managers in digital marketing |

---

## 4. Design System

### 4.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#C4A8B0` | Dusty Mauve — accents, borders, hover states |
| `--color-bg` | `#FAF7F4` | Warm Cream — page background |
| `--color-text` | `#2E2A2A` | Soft Charcoal — body text |
| `--color-deep` | `#8B6F72` | Deep Mauve — CTAs, active states |
| `--color-neutral` | `#E8E0DC` | Warm Gray — borders, subtle backgrounds |
| `--color-white` | `#FFFFFF` | Card backgrounds |

### 4.2 Typography

| Role | Font | Weights | Fallback |
|------|------|---------|----------|
| Headings | Playfair Display | 400, 500, 600, 700 | Noto Kufi Arabic, serif |
| Body | Inter | 300, 400, 500, 600 | Noto Kufi Arabic, sans-serif |
| Arabic | Noto Kufi Arabic | 300–700 | — |

### 4.3 Spacing & Layout

| Token | Value |
|-------|-------|
| `--max-width` | `1200px` |
| `--section-padding` | `clamp(4rem, 8vw, 8rem)` |
| `--container-padding` | `clamp(1.25rem, 4vw, 3rem)` |

### 4.4 Design Principles

- Generous whitespace — content breathes
- Subtle hover interactions only, no heavy animations
- Mobile-first, fully responsive
- RTL-ready (Arabic font fallbacks)
- Boutique creative studio feel, not a generic freelancer template

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Vue.js 3.5+ (Composition API, `<script setup>`) |
| Build Tool | Vite 8.2+ |
| Language | JavaScript (ES Modules) |
| Styling | Scoped CSS per component, CSS custom properties |
| Fonts | Google Fonts (CDN) |
| AI Backend | Google Gemini API (REST, `gemini-2.5-flash`) |
| Search | TF-IDF cosine similarity (client-side) |

### 5.2 Project Structure

```
shimaa/
├── index.html                         # Entry HTML, Google Fonts preload
├── .env                               # VITE_GEMINI_API_KEY (gitignored)
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg                    # Custom "S" monogram
└── src/
    ├── main.js                        # App bootstrap
    ├── App.vue                        # Root — wires all sections
    ├── style.css                      # Global styles, CSS variables, resets
    ├── composables/
    │   └── useScrollReveal.js         # IntersectionObserver fade-in
    ├── data/
    │   └── knowledge-base.json        # Structured KB for AI assistant
    ├── utils/
    │   └── similarity.js              # TF-IDF cosine similarity search
    ├── assets/
    │   └── styles/                    # (reserved for future use)
    └── components/
        ├── NavBar.vue                 # Fixed nav, mobile hamburger
        ├── HeroSection.vue            # Full-screen hero with fade-in
        ├── AboutSection.vue           # Two-column bio + stats
        ├── SkillsSection.vue          # 3x3 icon grid
        ├── ProjectsSection.vue        # 6 project cards with Instagram links
        ├── IndustriesSection.vue      # Badge list with examples
        ├── ApproachSection.vue        # 4-step numbered process
        ├── CertificationsSection.vue  # Horizontal scroll cards
        ├── ContactSection.vue         # Centered CTA + contact links
        ├── FooterSection.vue          # Minimal footer
        └── AIAssistant.vue            # Floating chat bubble + Gemini API
```

### 5.3 Component Architecture

Each section is a self-contained `.vue` SFC with:
- `<template>` — semantic HTML
- `<script setup>` — Composition API logic
- `<style scoped>` — isolated styles, no leaks

Shared logic extracted to composables:
- `useScrollReveal()` — observes `.fade-in` elements, adds `.visible` class

---

## 6. Page Sections

### 6.1 Hero

| Property | Value |
|----------|-------|
| Layout | Full-screen, two-column (text + visual frame) |
| Content | Name, title, tagline, 2 CTA buttons |
| Animation | Staggered fade-in on mount (100ms delay) |
| CTAs | "Explore My Work" → `#work`, "Let's Talk" → `#contact` |
| Visual | Abstract frame with "SR" initials, gradient background |
| Scroll indicator | Animated line at bottom |

### 6.2 About

| Property | Value |
|----------|-------|
| Layout | Two-column (text left, visual right) |
| Content | Bio paragraphs, languages, education, location |
| Visual | Decorative card with dot pattern + floating stat badges |
| Stats | 1+ Year Experience, 6+ Platforms, 3 Languages |
| Animation | Scroll-triggered fade-in |

### 6.3 Skills (What She Does)

| Property | Value |
|----------|-------|
| Layout | 3-column grid (2 on tablet, 1 on mobile) |
| Cards | 9 skill cards with icon, title, description |
| Icons | Inline SVG render functions (no icon library) |
| Skills | Social Media Management, Content Creation & Strategy, Content Calendars & Planning, Reels & Short-form Content, Copywriting & Captions, Creative Content Ideas, Audience & Competitor Research, Digital Marketing, AI-assisted Content Development |

### 6.4 Selected Work (Projects)

| Property | Value |
|----------|-------|
| Layout | 3-column grid (2 on tablet, 1 on mobile) |
| Cards | 6 project cards |
| Card Content | Number, industry badge, brand name, description, Instagram link |
| Projects | Jarrash Sabia (E-commerce), Wagf Momnah (NGO), Comfort Begins (Cleaning), Alwan Elhaz Elsaed (Creative), Velora Cosmatics (Beauty), Lazor (Services) |
| Hover | Bottom accent line scales in, card lifts |

### 6.5 Industries

| Property | Value |
|----------|-------|
| Layout | Two-column (text left, badge list right) |
| Badges | 7 industry rows with dot indicator and example brand |
| Industries | Furniture & Home, Marble, Pharmacy & Healthcare, Education, Cleaning Services, Beauty & E-commerce, Social Media Projects |

### 6.6 Approach (How She Works)

| Property | Value |
|----------|-------|
| Layout | 4-column grid (1 on mobile with vertical timeline) |
| Steps | Understand → Plan → Create → Optimize |
| Mobile | Vertical timeline with connecting line |

### 6.7 Certifications

| Property | Value |
|----------|-------|
| Layout | Horizontal scroll (drag/swipe on mobile) |
| Cards | 7 certification cards with icon, name, issuer |
| Certs | Google AI, Generative AI for Digital Marketing, AI Content Mastery, Meta Social Media Marketing, Google Digital Marketing & E-commerce, HubSpot Content Marketing, DELF B1 French |

### 6.8 Contact

| Property | Value |
|----------|-------|
| Layout | Centered single-column |
| Headline | "Let's Work Together" |
| Buttons | Email, LinkedIn, WhatsApp (pill-shaped) |
| Details | Email address + phone number |

### 6.9 Footer

| Property | Value |
|----------|-------|
| Layout | Centered, dark background |
| Content | Logo, tagline, nav links, copyright |

---

## 7. AI Assistant

### 7.1 Overview

A floating chat bubble (bottom-right corner) that answers visitor questions about Shymaa using a hybrid local + cloud approach.

### 7.2 UI Specifications

| Property | Value |
|----------|-------|
| Toggle | 56×56px rounded button, Dusty Mauve gradient |
| Label | "Ask about Shymaa" |
| Window | 380px wide, max 520px tall |
| Background | Warm Cream (`#FAF7F4`) |
| Messages | Assistant (white bubble, left), User (Deep Mauve bubble, right) |
| Typing indicator | 3-dot bouncing animation |
| Transitions | Scale + fade on open/close |

### 7.3 Smart Search Logic

```
User Question
    │
    ▼
┌─────────────────────────┐
│  TF-IDF Cosine Similarity│
│  (client-side)           │
│  Search all KB sections   │
└────────────┬────────────┘
             │
     ┌───────┴───────┐
     │               │
  Score ≥ 0.75    Score < 0.75
     │               │
     ▼               ▼
┌──────────┐   ┌──────────────┐
│ Return    │   │ Call Gemini   │
│ local     │   │ API           │
│ answer    │   │ (2.5-flash)   │
└──────────┘   └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │ Return API    │
               │ answer        │
               └──────────────┘
```

### 7.4 Knowledge Base Structure

`src/data/knowledge-base.json` contains:

| Section | Content |
|---------|---------|
| `identity` | Name, title, location, focus, email, phone, languages |
| `experience` | Years, current/previous roles, responsibilities |
| `education` | Degree, university, year, grade |
| `skills` | Array of 10 skill strings |
| `content_types` | Array of 8 content type strings |
| `industries` | Array of 6 industry strings with examples |
| `projects` | Array of 6 objects (name, industry, Instagram link) |
| `certifications` | Array of 7 certification strings |
| `approach` | Array of 4 step strings |
| `what_makes_her_different` | Differentiator statement |
| `qa_pairs` | Array of 7 pre-written Q&A pairs |

### 7.5 Similarity Algorithm

`src/utils/similarity.js`:

1. **Tokenization** — lowercase, remove punctuation, split on whitespace, filter short tokens
2. **Term Frequency** — count occurrences of each token
3. **Cosine Similarity** — dot product / (magnitude A × magnitude B)
4. **Indexing** — all KB sections flattened into searchable text-answer pairs:
   - QA pairs (question + answer)
   - Skills list
   - Experience details
   - Education details
   - Certifications list
   - Industries list
   - Projects list
   - Identity info
   - Differentiator
   - Approach steps

### 7.6 Gemini API Integration

| Property | Value |
|----------|-------|
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` |
| Auth | Query parameter `key=` |
| System Prompt | Embedded in `system_instruction.parts[0].text` |
| Knowledge Base | Injected into system prompt as plain text |
| Error Handling | 400/403 → config error message; other → generic fallback |
| API Key Validation | Must start with `AIzaSy` before attempting call |

### 7.7 System Prompt

```
You are the AI assistant on Shymaa Raouf Ali's portfolio website.
Your only job is to answer questions about Shymaa — her skills,
experience, work, and how to contact her.

RULES:
- Answer ONLY from the knowledge base below
- Never invent information not in the knowledge base
- Be warm, concise, and professional
- Reply in the same language the visitor uses (Arabic or English)
- If asked something outside the knowledge base, say:
  "I don't have details on that — you can reach Shymaa directly
   at raoufshimaa587@gmail.com"
- Never discuss other topics outside Shymaa's portfolio
```

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | ≤ 768px | Single column, hamburger nav, vertical timeline, stacked cards |
| Tablet | 769–1024px | 2-column grids, condensed spacing |
| Desktop | ≥ 1025px | Full 3/4-column layouts, side-by-side sections |

---

## 9. Animations & Interactions

| Element | Animation | Trigger |
|---------|-----------|---------|
| `.fade-in` | `translateY(30px)` → `0`, opacity 0 → 1 | IntersectionObserver (15% visible) |
| Hero text | Staggered fade-in (100ms, 300ms delays) | Page mount |
| Hero visual | Scale 0.95 → 1 + fade | Page mount (300ms after text) |
| Scroll indicator | Infinite vertical line animation | Page mount (1.5s delay) |
| Card hover | `translateY(-4px)`, border color change | Mouse enter |
| Project accent line | `scaleX(0)` → `scaleX(1)` | Mouse enter |
| Nav link underline | Width 0 → 100% | Mouse enter |
| Chat window | Scale 0.95 + translateY → normal | Toggle click |
| Chat icon | Rotate 90deg between states | Toggle click |

---

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Total Bundle Size | < 110KB gzipped |
| CSS Size | < 6KB gzipped |
| Lighthouse Performance | > 90 |
| Font Loading | Preconnect + display=swap |

---

## 11. Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari | iOS 14+ |
| Chrome Android | 90+ |

---

## 12. Security Considerations

| Item | Status |
|------|--------|
| API key exposure | `.env` gitignored, key only used client-side (acceptable for free tier) |
| External links | `rel="noopener noreferrer"` on all `target="_blank"` links |
| XSS | Vue's template engine auto-escapes; `v-html` only used on sanitized assistant responses |
| HTTPS | Required for Gemini API calls |

---

## 13. Deployment Requirements

| Requirement | Value |
|-------------|-------|
| Static hosting | Any (Vercel, Netlify, Cloudflare Pages, GitHub Pages) |
| Environment variable | `VITE_GEMINI_API_KEY` must be set in hosting platform |
| Build command | `npm run build` |
| Output directory | `dist/` |
| Node version | 18+ |

---

## 14. Future Enhancements

| # | Enhancement | Priority |
|---|-------------|----------|
| F1 | Contact form with EmailJS or Formspree | Medium |
| F2 | Dark mode toggle | Low |
| F3 | Blog section for content marketing tips | Medium |
| F4 | Analytics (Plausible/Umami) | High |
| F5 | Multi-language toggle (EN/AR) | High |
| F6 | Project detail pages with case studies | Medium |
| F7 | Testimonials section | Medium |
| F8 | Loading screen / skeleton states | Low |
| F9 | PWA support (offline, installable) | Low |
| F10 | Rate limiting on Gemini API calls | Medium |

---

## 15. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Sep 2026 | Initial build — all 9 sections, AI assistant, responsive design |
