# GeldScan

Een toegankelijke webapp die eurobiljetten herkent met de camera van je smartphone en het bedrag **uitspreekt**.
Gemaakt voor blinde en slechtziende mensen. Vraag *"Welk biljet is dit?"* of druk op de grote knop, en de app zegt
het meest waarschijnlijke antwoord.

Schoolproject *Campus Quest* (MCT3 – Future Tech), track D: eigen idee.

## Functies

- **"Welk biljet is dit?"**: de app kijkt ±1,2 seconde (10 beelden), neemt het gemiddelde per klasse en zegt het
  meest zekere antwoord: *"Dit is een biljet van twintig euro. Ik ben er zeker van."*
  - ≥ 90 % zeker → antwoord, en de scan wordt (met punten) opgeslagen in de backend
  - 60–90 % → *"Ik denk twintig euro, maar ik ben niet zeker…"* (niets opgeslagen)
  - anders → *"Ik zie geen biljet…"*, met een tip als het te donker is
- **Spraak**: Nederlandse stem (nl-BE), instelbare snelheid, volume en stem. Kies "de app praat zelf" of
  "alleen mijn schermlezer" (aria-live) om dubbele spraak te vermijden.
- **Spraakopdrachten** (optioneel): welk biljet is dit, herhaal, totaal, wis totaal, tellen aan/uit,
  automatisch aan/uit, lamp aan/uit, help, stop. Ook *push-to-talk*: de grote knop lang indrukken.
- **Trillen per biljet** (ook voor doofblinden): €5 = 1×, €10 = 2×, €20 = 3×, €50 = 4×.
- **Korte geluidjes** (Web Audio) voor kijken, gevonden, niet zeker, niets gevonden en fout.
- **Tellen**: telt meerdere biljetten op (*"Twintig euro. Totaal vijfenvijftig euro."*).
- **Automatisch**: zegt een biljet vanzelf zodra het 5 beelden op rij ≥ 90 % zeker is; hetzelfde biljet pas
  opnieuw nadat het weggehaald is.
- **Zaklamp**, scherm blijft aan tijdens het scannen, camera stopt als de app op de achtergrond gaat.
- **Beloningssysteem in de backend**: elke herkenning ≥ 90 % levert punten en badges op die (anoniem) in Firebase
  worden opgeslagen, of lokaal als Firebase niet ingesteld is. Ze worden bewust **niet getoond of uitgesproken**:
  voor de gebruiker draait alles om een snel en rustig antwoord.
- **Installeerbaar (PWA)**; het model wordt gecachet.

## Toegankelijkheid

- WCAG 2.2 AA als minimum: contrast ≥ 7:1 (geel op bijna-zwart, of zwart op wit), tekst vanaf 18 px en
  schaalbaar, knoppen ≥ 56 px, geen tijdslimieten, geen veegbewegingen nodig.
- Lettertype **Atkinson Hyperlegible**, ontworpen voor slechtziende lezers.
- Werkt met TalkBack, VoiceOver en een toetsenbord: skip-link, landmarks, één `h1` per pagina, focus gaat bij een
  paginawissel naar de titel en de nieuwe pagina wordt aangekondigd, `aria-pressed` op schakelaars,
  `aria-live` voor elk antwoord, `role="alert"` voor fouten.
- Gesproken uitleg bij de eerste start (opnieuw te starten via Instellingen).
- Respecteert `prefers-reduced-motion`.
- Automatische controle met **axe** op elke pagina (`npm test`).

## Privacy

- Camerabeelden worden alleen in het geheugen verwerkt (een canvas van 224×224) en **nooit** opgeslagen of verstuurd.
- In Firestore komen enkel: bedrag, zekerheid, punten, modus en tijdstip, onder een anonieme gebruikers-id.
- Spraakbediening staat standaard uit. Zet je ze aan, dan verwerkt de browser je stem; in Chrome gebeurt dat via
  de spraakdienst van Google. Dit staat ook in de app (Hulp en de uitleg bij de start).
- "Wis al mijn gegevens" in Instellingen verwijdert alle scans, je punten en je anonieme account.
- De dataset bevat enkel biljetten en oppervlakken, geen personen.

## Techniek

| Laag | Keuze |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite, Vue Router, Pinia, Tailwind CSS 4 |
| AI | TensorFlow.js + `@teachablemachine/image` (Teachable Machine-model) |
| Backend | Firebase: anonieme Authentication + Cloud Firestore (Spark, gratis) |
| Hosting | Vercel |
| PWA | `vite-plugin-pwa` |
| Tests | Vitest, axe-core, `@firebase/rules-unit-testing` |

## Lokaal starten

```bash
npm install
cp .env.example .env.local   # vul de Firebase-waarden in (of laat leeg: dan lokale punten)
npm run dev
```

Open `http://localhost:5173`. De camera werkt alleen via `https` of `localhost`. Testen op je telefoon kan het
makkelijkst via de Vercel-link.

| Script | Wat |
|---|---|
| `npm run dev` | ontwikkelserver |
| `npm run build` | type-check + productiebuild in `dist/` |
| `npm test` | unit- en toegankelijkheidstests |
| `npm run test:rules` | Firestore-regels testen met de emulator (Firebase CLI + Java nodig) |
| `npm run lint` | ESLint, met regels voor toegankelijkheid |

## Firebase instellen

Project: `bill-detector-37420`

1. **Authentication → Sign-in method → Anonymous** aanzetten.
2. **Firestore Database → Create database** (productiemodus, regio bv. `europe-west1`).
3. **Project settings → General → Your apps → Web app** toevoegen en de config overnemen in `.env.local`
   (en later in Vercel).
4. Regels uitrollen:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```
5. Na de Vercel-deploy: **Authentication → Settings → Authorized domains** → je Vercel-domein toevoegen.

### Datamodel

```
users/{uid}                 points, scanCount, seen[], badges[], streakDays, lastScanAt, lastScanValue, lastScanId, createdAt
users/{uid}/scans/{scanId}  label, valueEuro, confidence, points, mode, createdAt
```

Een scan en de nieuwe totalen worden in **één batch** geschreven. De regels (`firestore.rules`) controleren dat:
- elke gebruiker alleen zijn eigen data ziet;
- alleen geldige biljetten en een zekerheid ≥ 0,9 toegelaten zijn;
- punten alleen kunnen stijgen samen met een nieuwe scan;
- scans achteraf niet aangepast kunnen worden.

### Punten (alleen in de backend, niet zichtbaar in de app)

| Gebeurtenis | Punten |
|---|---|
| Biljet herkend (≥ 90 %) | +10 |
| Eerste scan | badge *Eerste biljet* |
| Alle biljetten minstens één keer herkend | +50 en badge *Alle biljetten herkend* |
| 3 dagen op rij | +25 en badge *Drie dagen op rij* |
| Hetzelfde biljet binnen 10 s | telt niet |

## Deploy op Vercel

1. Push naar GitHub en importeer de repo op vercel.com (framework: Vite; staat al in `vercel.json`).
2. **Settings → Environment Variables**: zet alle `VITE_FIREBASE_*`-waarden uit `.env.example`.
3. Deploy, en voeg het domein toe in Firebase (stap 5 hierboven).

`vercel.json` stuurt alle routes naar `index.html` (nodig voor Vue Router) en zet cache-headers voor het model.

## Model vervangen

Exporteer in Teachable Machine via **Model exporteren → Tensorflow.js → Download** en zet `model.json`,
`metadata.json` en `weights.bin` in `public/model/`. De klassen worden uit `metadata.json` gelezen: een klasse met
een getal (`20 euro`) is een biljet, een klasse zonder getal (`geen biljet`) betekent geen biljet. Extra klassen
(bv. `100 euro`) werken zonder codewijziging.

## Dataset

- **Eigen opnames**: video's met de smartphone, opgesplitst in beelden met ffmpeg (10 per seconde). Beelden zonder
  zichtbaar biljet zijn eruit gefilterd.
- **Roboflow Universe – "Euro Banknote Detection"** (currencybanknote, 2024), licentie **Public Domain**:
  biljetten uitgeknipt via de annotaties (enkel foto's met één soort biljet), plus achtergrondstukken zonder
  biljet voor de klasse *geen biljet*.

## Beperkingen

- Herkent **geen vals geld**; gebruik de app niet als enige controle bij betalingen.
- Spraakbediening werkt niet in elke browser (bv. Firefox); de grote knop werkt altijd.
- Het model is getraind op 5, 10, 20 en 50 euro.
