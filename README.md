# Khayali Pulao 🍚💭

A voice-first thought partner. Speak (or type) freely — books you want to read,
skills to learn, messages to send, work to do, things you're feeling — and the
app synthesizes that raw stream into structured items and reflects it back to you
like a sharp friend.

This repo is the **first build**: the core **capture → synthesize loop**, on
mobile (Expo / React Native), powered by Claude with a fully-offline fallback.

## What it does today

- **Capture** — one big, calm input. Talk (Web Speech API in the browser build)
  or type. However it comes out is fine.
- **Synthesize** — every thought stream is broken into atomic items, each routed
  to a type:
  - **To-do** — a concrete action, with a priority.
  - **Schedule** — something time-sensitive worth making time for.
  - **Insight** — a reflection, feeling, value, or pattern about you.
  - **Note** — anything else worth keeping (an idea, a book, a reference).
- **Thought partner reply** — after each capture, you get 2–4 warm, concrete
  sentences reacting to what actually mattered, sometimes with a specific next
  step or suggestion, and a nudge to whittle down if you're taking on too much.
- **Inbox** — everything you've captured, filterable by type or "open to-dos",
  with checkable to-dos.
- **Local-first** — thoughts and items live only on your device
  (`AsyncStorage`); the API key is stored in the secure keychain (or browser
  storage on web).

## The intelligence

The synthesis engine (`src/synthesis/`) has two backends:

- **`anthropic.ts`** — when a Claude API key is set in Settings, the raw thought
  is sent to Claude with a structured prompt that returns the items + the partner
  reply as JSON. This is where the depth lives.
- **`local.ts`** — a dependency-free, on-device heuristic classifier. It keeps the
  app fully functional with **no key and no network**, and is the automatic
  fallback if an API call fails.

`engine.ts` picks the backend and always degrades gracefully to local, so a
capture never fails.

## Run it

```bash
npm install
npm start          # then press i / a / w for iOS, Android, or web
```

- **Phone:** install **Expo Go**, run `npm start`, scan the QR code.
- **Browser** (best for trying voice-to-text): `npm run web`.

Add a Claude API key under **Settings** to enable Claude-powered synthesis. The
default model is `claude-sonnet-4-6`; Opus 4.8 and Haiku 4.5 are also selectable.

> Note on voice: live speech-to-text uses the browser's Web Speech API, so it
> works in the web build out of the box. On a native device, on-device STT needs
> a custom dev build — until then, type your thought; everything else is
> identical.

## Project layout

```
App.tsx                     Tab shell (Capture / Inbox / Settings)
index.ts                    Expo entry
src/
  types.ts                  Domain model (CapturedThought, SynthItem, …)
  storage.ts                AsyncStorage persistence
  settings.ts               Secure API-key + model storage
  theme.ts                  Colors, spacing, per-type styling
  util.ts                   ids, relative time
  store/AppContext.tsx      App state + the capture action
  synthesis/
    engine.ts               Backend selection + graceful fallback
    anthropic.ts            Claude-backed synthesis
    local.ts                On-device heuristic synthesis
  voice/useVoiceCapture.ts  Web Speech API hook (graceful native degrade)
  components/ItemCard.tsx    One synthesized item
  screens/                  Capture, Inbox, Settings
```

## Where this is headed

This build is deliberately the foundation. The larger vision — calendar
scheduling and "make time in my life for it", accountability nudges, a profile
that gets to know you over time, and book/course/video suggestions surfaced
proactively — builds on top of this capture → synthesize loop.
