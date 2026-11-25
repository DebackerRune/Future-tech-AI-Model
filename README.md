# GeldScan

Een webapp die eurobiljetten herkent met de camera van je smartphone en het bedrag uitspreekt, voor blinde en
slechtziende mensen.

**Live:** https://bill-detector-debackerrune-1343s-projects.vercel.app

## Functies

- Automatisch herkennen: houd een biljet voor de camera, na 2 seconden zegt de app het bedrag
- Grote knop *"Welk biljet is dit?"* om meteen te scannen
- Antwoord met zekerheid: zeker, niet zeker, onleesbaar of *"Ik zie geen biljet"* (na 10 seconden)
- De app leest zichzelf voor; met TalkBack of VoiceOver laat ze het voorlezen aan de schermlezer
- Tik één keer om te horen wat een knop is, twee keer om hem te gebruiken (met de muis: één klik)
- Spraakopdrachten: welk biljet is dit, herhaal, wat is het totaal bedrag, wis totaal, tellen aan/uit,
  lamp aan/uit, help, stop
- Tellen: telt biljetten op en zegt na elk biljet het totaal
- Trillen per biljet: €5 = 1×, €10 = 2×, €20 = 3×, €50 = 4×
- Korte geluidjes, zaklamp, scherm blijft aan tijdens het scannen
- Instellingen: spreeksnelheid, volume, geluid, trillen, kleuren
- Punten in de backend (Firebase) voor elke herkenning ≥ 90 %, niet zichtbaar in de app

## Privacy

- Camerabeelden blijven op het toestel en worden nooit opgeslagen of verstuurd.
- In Firebase komen enkel bedrag, zekerheid, punten en tijdstip, onder een anonieme id.
- "Wis al mijn gegevens" in Instellingen verwijdert alles.

## Techniek

| Laag | Keuze |
|---|---|
| Frontend | Vue 3 + TypeScript + Vite, Pinia, Tailwind CSS 4 |
| AI | Teachable Machine-model met TensorFlow.js (`@teachablemachine/image`) |
| Backend | Firebase: anonieme Authentication + Cloud Firestore |
| Hosting | Vercel |

## Lokaal starten

```bash
npm install
cp .env.example .env.local   # Firebase-config invullen
npm run dev
```

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
