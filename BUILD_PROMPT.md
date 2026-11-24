# Build prompt – GeldScan (euro banknote reader for blind users)

Build a complete, production-ready web app called **GeldScan**: a mobile-first, fully accessible web app that lets blind and visually impaired people identify euro banknotes with their phone camera. The user asks out loud **"Welk biljet is dit?"** (or presses one big button) and the app speaks the most confident answer. Everything must work with a screen reader (TalkBack, VoiceOver) **and** without one.

This is a school project (Campus Quest, track D: own idea). It must meet these requirements:
- A self-trained Teachable Machine image model (already trained, see "Model").
- Runs in the browser with TensorFlow.js and `@teachablemachine/image`.
- Runs on a smartphone over HTTPS (Vercel).
- A points/reward system that only reacts to predictions above a threshold (confidence ≥ 0.90), stored in a backend (Firebase).
- Camera images never leave the device.

The repository currently contains an old vanilla-JS draft (`index.html`, `app.js`, `backend.js`, `config.js`, `style.css`, `supabase.sql`, `README.md`, `model/`). Remove it and replace it with the new project. Do **not** touch `dataset/`, `dataset_public/`, `dataset_rejected/`, `upload/` or `BUILD_PROMPT.md`; add them to `.gitignore` except this prompt file.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build | Vite |
| Language | TypeScript (strict) |
| Routing | Vue Router (history mode) |
| State | Pinia |
| ML | `@tensorflow/tfjs` + `@teachablemachine/image` (pin versions that are compatible with each other; TM image 0.8.x works with tfjs 1.x — verify and pin exact versions) |
| Backend | Firebase (modular SDK v9+): Anonymous Authentication + Cloud Firestore (Spark/free plan) |
| Hosting | Vercel (Hobby), auto-deploy from GitHub |
| PWA | `vite-plugin-pwa` (installable, model files cached for offline use) |
| Tests | Vitest + Vue Test Utils; Firestore rules tests with `@firebase/rules-unit-testing` against the emulator |
| Lint/format | ESLint (vue + ts) + Prettier, plus `eslint-plugin-vuejs-accessibility` |

UI language: **Dutch (nl-BE)**. All visible text, spoken text and ARIA labels in Dutch. Keep all strings in one file (`src/i18n/nl.ts`) so they're easy to change.

---

## Model

- Teachable Machine image model exported to TensorFlow.js: `public/model/model.json`, `metadata.json`, `weights.bin` (I will drop the files in; ship a `public/model/README.md` explaining this, and show a clear spoken + visual error if the model is missing).
- Classes: `5 euro`, `10 euro`, `20 euro`, `50 euro`, `geen biljet`. Derive the euro value by parsing the number from the class name; a class without a number means "no banknote". Don't hard-code the class list — read it from `metadata.json` so the model can be retrained with more classes (e.g. 100 euro) without code changes.
- Model URL configurable via `VITE_MODEL_URL` (default `/model/`).

---

## Core feature 1 – "Welk biljet is dit?" (ask mode, the main feature)

1. The user triggers a question in one of three ways:
   - says a wake phrase (see voice commands) while listening is on,
   - presses the big **"Welk biljet is dit?"** button (fills most of the screen; also works with screen-reader double-tap),
   - presses Space/Enter on a keyboard.
2. The app plays a short "listening/looking" earcon and haptic tick, then samples the camera for ~1.2 s (e.g. 10 frames, one every ~120 ms).
3. For each frame: center-crop to a square, resize to 224×224 on an in-memory canvas, run `model.predict`.
4. **Aggregate**: average the probability per class over all frames. The answer is the class with the highest average probability.
5. Decide what to say:
   - top class is a note and avg confidence ≥ 0.90 → "Dit is een biljet van twintig euro." + confidence phrase ("Ik ben er zeker van." ≥ 0.97, otherwise "Ik ben er vrij zeker van."). Award points (see points system).
   - top class is a note but 0.60 ≤ avg confidence < 0.90 → "Ik denk twintig euro, maar ik ben niet zeker. Houd het biljet plat, ongeveer twintig centimeter voor de camera, en vraag het opnieuw." No points.
   - top class is "geen biljet", or confidence < 0.60 → "Ik zie geen biljet. Houd het biljet voor de camera en vraag het opnieuw."
   - frames too dark (mean luminance below a threshold) → add "Het is erg donker. Zet de lamp aan." and offer the torch.
6. Vibration pattern per note so deaf-blind users get the answer too: €5 = 1 long pulse, €10 = 2, €20 = 3, €50 = 4 (pulse 250 ms, pause 150 ms). Configurable.
7. The aggregation must be a pure, unit-tested function (`aggregatePredictions(frames, labels) → { label, value, confidence, perClass }`).

## Core feature 2 – Continuous mode (optional, toggle)

- When on, the app keeps predicting (~every 150 ms) and announces a note automatically once the same note class stays ≥ 0.90 for 5 consecutive frames.
- Never repeat the same note unless "geen biljet" was seen in between (the note was removed), with a minimum 1.5 s gap between announcements.
- After 8 s without a result, speak one hint, then stay quiet for at least 16 s.

## Core feature 3 – Counting mode

- Toggle "Tellen". Each confidently recognised note is added to a running total: "Twintig euro. Totaal vijfenvijftig euro."
- Voice/button commands to say the total and to reset it (reset asks for confirmation by voice or second press).

---

## Audio / voice (accessibility is the point of the app)

### Text-to-speech
- `speechSynthesis` with a Dutch voice: prefer `nl-BE`, then any `nl-*`. Handle voices loading asynchronously (`voiceschanged`).
- Settings: speech rate (0.7–1.5), volume, voice choice, "app speech on/off".
- **Screen-reader aware**: every message is *also* written to a visually hidden `aria-live="assertive"` region. In settings the user can choose "Laat de app praten" (TTS) or "Alleen mijn schermlezer" (aria-live only) to avoid double speech. Default: TTS on. Ask about this in onboarding.
- New messages cancel the current utterance (no queue pile-up). Important messages (the answer) are never cut off by hints.
- Numbers spoken as Dutch words where the TTS gets it wrong (e.g. "€" never read as "euro-teken").

### Speech recognition (voice commands)
- Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`), `lang = 'nl-BE'`, interim results off.
- Feature-detect; if unsupported (e.g. Firefox), hide voice options and explain once: "Spraakbediening werkt niet in deze browser. Gebruik de grote knop."
- **Listening is opt-in**: a toggle "Luisteren", default off, plus push-to-talk (long-press on the big button). Auto-restart recognition after `onend` while the toggle is on; stop when the tab is hidden.
- Match commands loosely (lowercase, strip punctuation, accept variants and common mis-hearings). Commands:

| Intent | Example phrases |
|---|---|
| ask | "welk biljet is dit", "wat biljet is dit", "wat is dit", "hoeveel is dit", "scan", "kijk" |
| repeat | "herhaal", "nog eens", "wat zei je" |
| total | "totaal", "hoeveel heb ik" |
| reset total | "wis totaal", "reset" |
| counting on/off | "tellen aan", "tellen uit" |
| continuous on/off | "automatisch aan", "automatisch uit" |
| torch | "lamp aan", "lamp uit" |
| points | "punten", "hoeveel punten" |
| help | "help", "wat kan ik zeggen" |
| stop | "stop", "stil" |

- Put the command matcher in a pure, unit-tested module (`parseCommand(text) → intent | null`).
- **Privacy note (must be disclosed in the app's privacy screen and README):** in Chrome, the Web Speech API sends audio to Google's speech service. Camera images never leave the device, but voice commands do. That's why listening is opt-in and the button always works without voice.

### Earcons and haptics
- Short distinct sounds generated with the Web Audio API (no audio files needed): "start looking", "note found", "not sure", "no note", "error". Respect a "sounds on/off" setting.
- Haptics via `navigator.vibrate` where supported; respect a setting.

---

## Accessibility requirements (WCAG 2.2 AA minimum, aim for AAA where cheap)

- `lang="nl"` on `<html>`, meaningful `<title>` per route, landmarks (`header`, `main`, `nav`), one `h1` per page.
- The primary action is reachable as the **first focusable element** after a skip link; on the scan page the big button gets focus on load.
- Touch targets ≥ 48×48 px (primary button: most of the screen). No gestures that need precision; no swipe-only actions; no time limits.
- Everything usable with: TalkBack, VoiceOver, keyboard only, switch access. Test focus order and that every control has an accessible name, role and state (`aria-pressed` for toggles).
- High-contrast default theme (yellow `#FFD400` on black), plus a light high-contrast theme; text ≥ 18 px, scalable to 200% without loss; respects `prefers-reduced-motion` and `prefers-color-scheme`. Contrast ≥ 7:1 for text.
- Never rely on colour alone; the confidence bars (for sighted helpers) are `aria-hidden` and duplicated in text.
- Route changes announce the new page title and move focus to the `h1`.
- Status messages via `aria-live`; errors via `role="alert"`.
- **Spoken onboarding** on first launch (skippable, repeatable from settings): what the app does, how to hold the note (flat, ~20 cm, good light), how to ask, the voice commands, the privacy note. Ask camera permission with an explanation *before* the browser prompt.
- Keep the screen awake while scanning (Screen Wake Lock API, re-acquire on `visibilitychange`).
- Torch toggle when `track.getCapabilities().torch` exists.
- Camera: rear camera (`facingMode: environment`), `playsinline`, muted; handle permission denied / no camera / not HTTPS with clear spoken messages and recovery steps.
- Stop the camera and recognition when the tab is hidden; resume politely when visible again.
- Run axe (`@axe-core/playwright` or `vitest-axe`) in tests on every route with zero violations.

---

## Pages (Vue Router)

| Route | Purpose |
|---|---|
| `/` Scan | camera view, big "Welk biljet is dit?" button, toggles (Luisteren, Tellen, Automatisch, Lamp), live result text, "Herhaal" |
| `/punten` Points | points, number of scans, streak, badges, recent scans (spoken summary button: "Lees mijn punten voor") |
| `/instellingen` Settings | speech on/off, rate, voice, sounds, vibration, threshold (read-only display), theme, repeat onboarding, delete my data |
| `/hulp` Help & privacy | instructions, voice command list, privacy explanation, disclaimer ("herkent geen vals geld") |

A simple bottom navigation with large labelled buttons; on the Scan page the navigation comes after the main controls in focus order.

---

## Backend – Firebase

### Auth
- Anonymous sign-in on first load (`signInAnonymously`), persisted. No personal data is ever asked.

### Firestore data model

```
users/{uid}
  points: number
  scanCount: number
  seen: number[]            // euro values recognised at least once, e.g. [5, 20]
  badges: string[]          // "first-scan", "all-notes", "streak-3"
  streakDays: number
  lastScanAt: timestamp
  createdAt: timestamp

users/{uid}/scans/{scanId}
  label: string             // "20 euro"
  valueEuro: number         // 5 | 10 | 20 | 50
  confidence: number        // 0.90 – 1
  points: number
  mode: "ask" | "continuous" | "counting"
  createdAt: timestamp      // serverTimestamp()
```

**No images, no audio, no personal data.**

### Points logic (pure, unit-tested function `computeReward(userState, scan, now)`)
- +10 per confidently recognised note (confidence ≥ 0.90).
- First scan ever → badge `first-scan`.
- First time all note values present in the model have been recognised → +50 and badge `all-notes`.
- 3 consecutive calendar days with ≥ 1 scan → +25 and badge `streak-3` (once). Streak resets after a missed day.
- Anti-abuse: the same note value counts for points at most once per 10 s.
- Speak new badges: "Gefeliciteerd, je hebt de badge … verdiend."

### Writes
- Write the scan document and the updated user totals in **one batched write** (`writeBatch`), so they never drift apart.
- Enable Firestore offline persistence (`persistentLocalCache`), so scans made offline sync later.

### Security rules (`firestore.rules`)
- A user can only read/write `users/{uid}` and its `scans` where `request.auth.uid == uid`.
- `scans`: create only; `valueEuro in [5, 10, 20, 50]` (or derive from an allowed list), `0.9 <= confidence <= 1`, `points` within the allowed set, `createdAt == request.time`, `mode` in the allowed values; no update/delete.
- `users/{uid}`: points may only increase, by at most the maximum reward per write; `scanCount` increases by exactly 1 per write when a scan is created (use `getAfter`/`existsAfter` to check the batch is consistent).
- "Delete my data" in settings: implement via a callable path that is allowed by the rules (e.g. allow the owner to delete their own scans and user doc) — make sure the rules allow that and nothing else.
- Write rules tests against the Firestore emulator covering allowed and denied cases.

### Config files
- `firebase.json` + `.firebaserc` (rules and emulator config only; hosting is on Vercel).
- `.env.example` with `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_MODEL_URL`.
- If Firebase env vars are missing, the app still works fully with points kept locally (localStorage) and says so in settings.

---

## Hosting – Vercel

- `vercel.json` with an SPA rewrite of all routes to `/index.html`, and long cache headers for `/model/*` and hashed assets.
- README steps: import the GitHub repo in Vercel, set the env vars, deploy; then add the Vercel domain to Firebase → Authentication → Settings → Authorized domains.
- The camera needs HTTPS; Vercel provides it.

---

## Privacy (must be visible in the app and the README)

- Camera frames are processed only in memory on the device (in-memory canvas, never stored, never uploaded).
- Only the result (note value, confidence, points, time) and an anonymous user id are stored in Firestore.
- Voice commands (opt-in) are processed by the browser's speech service (Google in Chrome) — disclosed clearly.
- The dataset contains only banknotes and surfaces; no people.

---

## Project structure (suggested)

```
src/
  main.ts, App.vue, router.ts
  i18n/nl.ts
  pages/ScanPage.vue, PointsPage.vue, SettingsPage.vue, HelpPage.vue
  components/BigAskButton.vue, ToggleButton.vue, LiveRegion.vue, ConfidenceBars.vue, BottomNav.vue, Onboarding.vue
  composables/useCamera.ts, useModel.ts, useSpeech.ts, useRecognition.ts, useEarcons.ts, useHaptics.ts, useWakeLock.ts
  lib/aggregate.ts, lib/commands.ts, lib/reward.ts, lib/labels.ts
  stores/settings.ts, stores/scan.ts, stores/points.ts
  firebase/index.ts, firebase/scans.ts
public/model/README.md
firestore.rules, firebase.json, .firebaserc, vercel.json, .env.example
tests/ (unit: aggregate, commands, reward, labels; rules; a11y)
```

---

## Quality bar / done when

- `npm run dev`, `npm run build`, `npm run test`, `npm run lint` all pass; TypeScript strict with no errors.
- Unit tests for `aggregatePredictions`, `parseCommand`, `computeReward`, label parsing; rules tests pass on the emulator; axe finds no violations on any route.
- Works on Android Chrome with TalkBack and on iOS Safari with VoiceOver: the full flow "open app → onboarding → ask 'Welk biljet is dit?' → hear the answer → points saved" works without looking at the screen.
- Lighthouse on the deployed Vercel URL: Accessibility 100, PWA installable, Performance ≥ 80 on mobile.
- A `README.md` (Dutch) with: what it is, setup, Firebase setup (enable Anonymous auth, create Firestore, deploy rules), model replacement, Vercel deploy, privacy, accessibility features, voice commands, known limitations (Web Speech support, no counterfeit detection), and dataset credits (own phone videos + Roboflow "Euro Banknote Detection", Public Domain).

Work in small, committed steps. Ask me before deleting anything outside the old draft files listed above.
