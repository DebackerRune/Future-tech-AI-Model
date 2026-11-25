# GeldScan

- **Webapp (best op gsm met geluid):** https://bill-detector-debackerrune-1343s-projects.vercel.app
- **Repo:** https://github.com/DebackerRune/Future-tech-AI-Model

Een webapp die eurobiljetten herkent met de camera van je smartphone en het bedrag uitspreekt, voor blinde en
slechtziende mensen.

## Functies

- Automatisch herkennen: houd een biljet voor de camera, na 2 seconden zegt de app het bedrag
- Grote knop _"Welk biljet is dit?"_ om meteen te scannen
- Antwoord met zekerheid: zeker, niet zeker, onleesbaar of _"Ik zie geen biljet"_ (na 10 seconden)
- De app leest zichzelf voor; met TalkBack of VoiceOver laat ze het voorlezen aan de schermlezer
- Tik één keer om te horen wat een knop is, twee keer om hem te gebruiken (met de muis: één klik)
- Spraakopdrachten: welk biljet is dit, herhaal, wat is het totaal bedrag, wis totaal, tellen aan/uit,
  lamp aan/uit, help, stop
- Tellen: telt biljetten op en zegt na elk biljet het totaal
- Trillen per biljet: €5 = 1×, €10 = 2×, €20 = 3×, €50 = 4×
- Korte geluidjes, zaklamp, scherm blijft aan tijdens het scannen
- Instellingen: spreeksnelheid, volume, geluid, trillen, kleuren
- Elke herkenning ≥ 90 % wordt (anoniem) opgeslagen in de backend (Firebase), niet zichtbaar in de app

## Techniek

| Laag     | Keuze                                                                 |
| -------- | --------------------------------------------------------------------- |
| Frontend | Vue 3 + TypeScript + Vite, Pinia, Tailwind CSS 4                      |
| AI       | Teachable Machine-model met TensorFlow.js (`@teachablemachine/image`) |
| Backend  | Firebase: anonieme Authentication + Cloud Firestore                   |
| Hosting  | Vercel                                                                |

## Lokaal starten

```bash
npm install
cp .env.example .env.local   # Firebase-config invullen
npm run dev
```

## Dataset

Vijf klassen: `5 euro`, `10 euro`, `20 euro`, `50 euro` en `geen biljet`. Getraind in
[Teachable Machine](https://teachablemachine.withgoogle.com/) (Image project, MobileNet).

| Klasse      | Eigen opnames | Roboflow | Totaal    |
| ----------- | ------------- | -------- | --------- |
| 5 euro      | 160           | 200      | 360       |
| 10 euro     | 148           | 200      | 348       |
| 20 euro     | 182           | 193      | 375       |
| 50 euro     | 177           | 200      | 377       |
| geen biljet | 168           | 192      | 360       |
| **Totaal**  | **835**       | **985**  | **1 820** |

Zo heb ik de dataset gemaakt:

1. **Eigen opnames**: per biljet een video met de smartphone, het biljet in de hand, gekanteld, gedraaid,
   dichtbij en veraf, boven een tafel en een laptop in het klaslokaal. Voor _geen biljet_ filmde ik de lege
   tafel, het lokaal, mijn hand en de laptop zonder biljet.
2. De video's opgesplitst in beelden met **ffmpeg** (10 per seconde).

3. **Roboflow Universe – "Euro Banknote Detection"** (currencybanknote, 2024), licentie **Public Domain**:
   biljetten uitgeknipt via de annotaties (enkel foto's met één soort biljet), plus achtergrondstukken zonder
   biljet voor de klasse _geen biljet_. Zo komen er andere biljetten, handen, achtergronden en camera's bij.
4. Klassen ongeveer even groot gehouden (±350 per klasse), zodat het model geen klasse voortrekt.

De beelden zelf staan niet in de repo (`dataset/`, `dataset_public/` en `dataset_rejected/` staan in `.gitignore`).

## Waar het model faalde

| Situatie                                                                                      | Wat er gebeurde                                                                                                                                                                    | Wat ik aanpaste                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bewegend of wazig beeld** (biljet nog in beweging, hand trilt)                              | Eén scherp beeld herkende het biljet, maar de wazige beelden ernaast trokken het gemiddelde onder de grens. De app zei dan "niet zeker" terwijl het biljet duidelijk in beeld was. | Elk beeld stemt nu op een klasse; de zekerheid is het gemiddelde over de beelden die de winnaar kozen. Bij twijfel kijkt de app 8 beelden extra. In de dataset de beelden zonder zichtbaar biljet verwijderd. |
| **Weinig licht** (avond, schaduw van de hand)                                                 | Het biljet werd te donker en het model koos _geen biljet_ of twijfelde tussen 10 en 20 euro.                                                                                       | De app meet de helderheid van het beeld en zegt _"Het is erg donker. Zet de lamp aan"_. Zaklamp-knop en spraakopdracht _"lamp aan"_ toegevoegd.                                                               |
| **Andere omgeving en persoon** (andere hand, andere tafel, ander toestel dan in mijn video's) | Mijn eigen opnames komen uit één lokaal, met één hand en één telefoon. Op een andere achtergrond was het model minder zeker.                                                       | Roboflow-dataset toegevoegd (andere biljetten, handen, achtergronden en camera's) en de klassen even groot gemaakt.                                                                                           |

## Reflectie

**Hoe zou ik mijn trigger moeilijker foppen?** Nu reageert de app op alles wat op een biljet lijkt: een foto van
een biljet, een biljet op een scherm of een kopie wordt ook herkend. Ik zou een klasse _"foto/scherm van een
biljet"_ toevoegen met beelden van biljetten op schermen en papier, zodat het model leert dat dat geen echt
biljet is.

**Welke bias zit er in mijn dataset?** Mijn eigen beelden zijn gemaakt door één persoon, met één telefoon, in
één klaslokaal met goed licht en een lichte tafel. Biljetten van 100, 200 en 500 euro ontbreken helemaal.
als oude reeksen, gekreukte of gescheurde biljetten zullen ook niet herkent worden.

## AI-verantwoording

Het idee, de video's en foto's, het kiezen en opschonen van de beelden, het trainen in Teachable Machine en het testen op mijn telefoon heb ik zelf gedaan. Ik heb de ai vooral de code laten schrijven en bijgestuurd wanneer het niet uitwerkte wat ik in gedachten had.

**Wat ik aanpaste.** Ik heb elke versie op mijn eigen telefoon getest en teruggestuurd wat niet werkte. Ik heb de drempels gekozen en wat bijgestuurd wat
