# GeldScan

Een toegankelijke webapp die eurobiljetten herkent met de camera van je smartphone en het bedrag **uitspreekt**.
Gemaakt voor blinde en slechtziende mensen. Vraag *"Welk biljet is dit?"* of druk op de grote knop, en de app zegt.

## Functies

- **Automatisch (staat altijd aan)**: de camera kijkt ±4× per seconde mee. Ziet de app een biljet (3 van de
  laatste 5 beelden ≥ 50 %), dan klinkt een kort geluidje en scant ze **2 seconden**; daarna volgt hetzelfde
  antwoord als bij de knop. Hetzelfde biljet wordt pas opnieuw gezegd (en geteld) als het ±1 s uit beeld is
  geweest; een ander biljet meteen. Na een onzeker antwoord probeert de app het één keer opnieuw.
  *"Ik zie geen biljet"* komt alleen na **10 seconden** zonder biljet, en één keer per stille periode.
  Er is geen knop of spraakopdracht om het uit te zetten.
- **"Welk biljet is dit?"** (knop of spraak, ook naast automatisch): de app kijkt ±1,2 seconde (10 beelden). Elk beeld stemt op een klasse; het biljet
  met de meeste stemmen wint en zijn zekerheid is het gemiddelde over die beelden. Daarna:
  - ≥ 80 % zeker (en minstens de helft van de beelden eens) → *"Dit is een biljet van twintig euro."*
  - ≥ 90 % → ook opgeslagen in de backend, met punten
  - 50–80 % → *"Ik denk twintig euro, maar ik ben niet zeker…"*
  - een biljet maar < 50 % → *"Ik zie een biljet, maar ik kan het niet goed lezen…"*
  - alleen als *geen biljet* wint → *"Ik zie geen biljet…"*; met een tip als het te donker is
  - bij twijfel kijkt de app eerst nog 8 beelden extra
- **Spraak**: de app leest zichzelf voor (Nederlandse stem, instelbare snelheid en volume). Gebruikt iemand
  TalkBack of VoiceOver, dan herkent de app dat aan de tik op het startscherm en laat ze het voorlezen aan de
  schermlezer over.
- **Spraakopdrachten** (optioneel): welk biljet is dit, herhaal, wat is het totaal bedrag, wis totaal,
  tellen aan/uit, lamp aan/uit, help, stop. Ook *push-to-talk*: de grote knop lang indrukken.
- **Trillen per biljet** (ook voor doofblinden): €5 = 1×, €10 = 2×, €20 = 3×, €50 = 4×.
- **Korte geluidjes** (Web Audio) voor kijken, gevonden, niet zeker, niets gevonden en fout.
- **Tellen**: telt meerdere biljetten op (*"Twintig euro. Totaal vijfenvijftig euro."*).
- **Zaklamp**, scherm blijft aan tijdens het scannen, camera stopt als de app op de achtergrond gaat.
- **Beloningssysteem in de backend**: elke herkenning ≥ 90 % levert punten en badges op die (anoniem) in Firebase
  worden opgeslagen, of lokaal als Firebase niet ingesteld is. Ze worden bewust **niet getoond of uitgesproken**:
  voor de gebruiker draait alles om een snel en rustig antwoord.
- **Installeerbaar (PWA)**; het model wordt gecachet.

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
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173`. De camera van de gsm werkt alleen via `https` of `localhost`. Testen op je telefoon kan het

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

Vijf klassen: `5 euro`, `10 euro`, `20 euro`, `50 euro` en `geen biljet`. Getraind in
[Teachable Machine](https://teachablemachine.withgoogle.com/) (Image project, MobileNet).

| Klasse | Eigen opnames | Roboflow | Totaal |
|---|---|---|---|
| 5 euro | 160 | 200 | 360 |
| 10 euro | 148 | 200 | 348 |
| 20 euro | 182 | 193 | 375 |
| 50 euro | 177 | 200 | 377 |
| geen biljet | 168 | 192 | 360 |
| **Totaal** | **835** | **985** | **1 820** |

Zo heb ik de dataset gemaakt:

1. **Eigen opnames**: per biljet een video met de smartphone, het biljet in de hand, gekanteld, gedraaid,
   dichtbij en veraf, boven een tafel en een laptop in het klaslokaal. Voor *geen biljet* filmde ik de lege
   tafel, het lokaal, mijn hand en de laptop zonder biljet.
2. De video's opgesplitst in beelden met **ffmpeg** (10 per seconde).
3. **Opgeschoond**: 42 beelden waarop het biljet niet of nauwelijks zichtbaar was (uit beeld, volledig wazig)
   verwijderd, zodat het model niet leert dat een lege tafel "5 euro" is.
4. **Roboflow Universe – "Euro Banknote Detection"** (currencybanknote, 2024), licentie **Public Domain**:
   biljetten uitgeknipt via de annotaties (enkel foto's met één soort biljet), plus achtergrondstukken zonder
   biljet voor de klasse *geen biljet*. Zo komen er andere biljetten, handen, achtergronden en camera's bij.
5. Klassen ongeveer even groot gehouden (±350 per klasse), zodat het model geen klasse voortrekt.
6. **Evaluatie** met `tools/train-tm` (`node tools/train-tm/server.mjs`): de laatste 20 % van elke klasse en
   elke bron blijft apart als testset. Omdat de bestanden op naam gesorteerd zijn, komen beelden van hetzelfde
   moment in de video niet tegelijk in de trainings- en testset. Resultaat: **97,5 %** juist met MobileNet
   (alpha 0,35), tegenover 97,0 % met het grotere model (alpha 1,0). De app gebruikt het kleinere, snellere model.

De beelden zelf staan niet in de repo (`dataset/`, `dataset_public/` en `dataset_rejected/` staan in `.gitignore`).

## Waar het model faalde

| Situatie | Wat er gebeurde | Wat ik aanpaste |
|---|---|---|
| **Bewegend of wazig beeld** (biljet nog in beweging, hand trilt) | Eén scherp beeld herkende het biljet, maar de wazige beelden ernaast trokken het gemiddelde onder de grens. De app zei dan "niet zeker" terwijl het biljet duidelijk in beeld was. | Elk beeld stemt nu op een klasse; de zekerheid is het gemiddelde over de beelden die de winnaar kozen. Bij twijfel kijkt de app 8 beelden extra. In de dataset de beelden zonder zichtbaar biljet verwijderd. |
| **Weinig licht** (avond, schaduw van de hand) | Het biljet werd te donker en het model koos *geen biljet* of twijfelde tussen 10 en 20 euro. | De app meet de helderheid van het beeld en zegt *"Het is erg donker. Zet de lamp aan"*. Zaklamp-knop en spraakopdracht *"lamp aan"* toegevoegd. |
| **Andere omgeving en persoon** (andere hand, andere tafel, ander toestel dan in mijn video's) | Mijn eigen opnames komen uit één lokaal, met één hand en één telefoon. Op een andere achtergrond was het model minder zeker. | Roboflow-dataset toegevoegd (andere biljetten, handen, achtergronden en camera's) en de klassen even groot gemaakt. Met de aparte testset gecontroleerd: 97,5 %. |

## Reflectie

**Hoe zou ik mijn trigger moeilijker foppen?** Nu reageert de app op alles wat op een biljet lijkt: een foto van
een biljet, een biljet op een scherm of een kopie wordt ook herkend. Ik zou een klasse *"foto/scherm van een
biljet"* toevoegen met beelden van biljetten op schermen en papier, zodat het model leert dat dat geen echt
biljet is. Daarnaast kan de app beide kanten laten tonen, of controleren of het biljet beweegt en van vorm
vervormt zoals echt papier. Een echte controle op vals geld (watermerk, hologram onder licht) kan een gewone
camera niet; daarom staat in de app dat ze geen vals geld herkent.

**Welke bias zit er in mijn dataset?** Mijn eigen beelden zijn gemaakt door één persoon, met één telefoon, in
één klaslokaal met goed licht en een lichte tafel. Biljetten van 100, 200 en 500 euro ontbreken helemaal, net
als oude reeksen, gekreukte of gescheurde biljetten. Blinde gebruikers houden het biljet bovendien vaak scheef
of half uit beeld, terwijl ik keek wat ik filmde. De Roboflow-foto's maken dat iets beter, maar zijn meestal
belichte foto's van bovenaf. Het model is dus het sterkst in situaties die het minst lijken op het echte
gebruik.

## AI-verantwoording

| | |
|---|---|
| **Tool** | Claude Code (Anthropic, model Claude Opus 5.5) in VS Code |
| **Waarvoor** | De code van de webapp (Vue, TypeScript, Firebase, tests), de lokale trainings- en testtool in `tools/train-tm` en hulp bij deze README |
| **Niet met AI** | Het idee, de video's en foto's, het kiezen en opschonen van de beelden, het trainen in Teachable Machine en het testen op mijn telefoon |

**Prompts.** De hoofdprompt staat volledig in [`BUILD_PROMPT.md`](BUILD_PROMPT.md): het idee, de doelgroep, de
eisen van de opdracht (Teachable Machine, TensorFlow.js, drempel van 90 % voor punten, Firebase, Vercel) en
de toegankelijkheidseisen. Daarna heb ik in korte vervolgprompts gevraagd om:

- een toegankelijkheidsaudit en de fouten daaruit te verbeteren;
- de punten uit de app te halen en alleen in de backend op te slaan;
- de app zichzelf te laten voorlezen zonder schermlezer, en TalkBack/VoiceOver automatisch te herkennen;
- de beslissing uit de camerabeelden te verbeteren toen de app te vaak "niet zeker" zei;
- een tool om het model lokaal te trainen en te testen met een aparte testset;
- de automatische modus eerst weg te halen en daarna in een eenvoudigere vorm terug te brengen;
- het trillen sterker te maken.

**Wat ik aanpaste.** Ik heb elke versie op mijn eigen telefoon getest en teruggestuurd wat niet werkte. Ik
heb de drempels gekozen (80 % om iets te zeggen, 90 % voor punten), de punten onzichtbaar gemaakt omdat ze
een blinde gebruiker alleen afleiden, en de automatische modus herschreven omdat de eerste versie te veel
praatte. De AI stelde voor om modellen te vergelijken; op basis van de testresultaten koos ik zelf het kleinere
model.

**Hoe ik AI gebruikte.** Als programmeur die mijn plan uitvoert: ik bepaalde wat de app moet doen en voor wie,
de AI schreef de code, en ik controleerde het resultaat in de praktijk. De dataset en het model zijn volledig
mijn eigen werk.

## Beperkingen

- Herkent **geen vals geld**; gebruik de app niet als enige controle bij betalingen.
- Spraakbediening werkt niet in elke browser (bv. Firefox); de grote knop werkt altijd.
- Het model is getraind op 5, 10, 20 en 50 euro.
