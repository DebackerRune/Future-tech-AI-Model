import { euroWords } from '@/lib/numberWords'

/** Every visible and spoken text of the app (nl-BE). */
export const nl = {
  appName: 'GeldScan',
  skipLink: 'Ga naar de inhoud',

  nav: {
    label: 'Hoofdmenu',
    scan: 'Scannen',
    settings: 'Instellingen',
    help: 'Hulp',
  },

  titles: {
    scan: 'Biljet herkennen',
    settings: 'Instellingen',
    help: 'Hulp en privacy',
    notFound: 'Pagina niet gevonden',
  },

  pageOpened: (title: string) => `${title}.`,

  /** Start screen: one tap anywhere unlocks speech (browsers block speech before the first touch). */
  start: {
    title: 'GeldScan',
    tap: 'Tik ergens op het scherm om te starten',
    hint: 'De app praat dan en legt uit hoe ze werkt.',
    screenReaderOn: 'Schermlezer herkend. De app laat het voorlezen nu over aan je schermlezer.',
  },

  /** Spoken explanation of the app and the screen layout. */
  intro: {
    full:
      'Welkom bij GeldScan. Deze app herkent eurobiljetten en zegt het bedrag. ' +
      'Houd een biljet plat, ongeveer twintig centimeter voor de camera aan de achterkant van je telefoon. ' +
      'De app herkent het vanzelf: je hoort een kort geluidje, houd het biljet dan twee seconden stil, en de app zegt het bedrag. ' +
      'Wil je niet wachten? Bijna het hele scherm is één grote knop. Tik daarop om meteen te scannen. ' +
      'De eerste keer vraagt je telefoon toegang tot de camera. Tik dan op Toestaan. ' +
      'Helemaal onderaan het scherm staan drie knoppen naast elkaar: links Scannen, in het midden Instellingen, rechts Hulp. ' +
      'Alle andere knoppen tik je één keer aan om te horen wat ze doen, en nog een keer om ze te gebruiken. ' +
      'Wil je dit opnieuw horen? Open dan Hulp, onderaan rechts.',
    /** Sent to TalkBack/VoiceOver when a screen reader was detected on the start screen. */
    screenReader:
      'Welkom bij GeldScan. Schermlezer herkend, de app laat het voorlezen aan je schermlezer over. ' +
      'Houd een biljet plat, ongeveer twintig centimeter voor de camera aan de achterkant. De app herkent het vanzelf en zegt het bedrag. ' +
      'De focus staat op de grote knop Welk biljet is dit. Dubbeltik om meteen te scannen. ' +
      'Onderaan staan Scannen, Instellingen en Hulp.',
    short:
      'GeldScan is klaar. Houd een biljet voor de camera, de app herkent het vanzelf. Of tik in het midden van het scherm om meteen te scannen. Onderaan rechts staat Hulp, als je de uitleg opnieuw wil horen.',
  },

  /** Spoken when a page opens, so the user knows what is on it and where. */
  pageIntro: {
    scan:
      'Biljet herkennen. Houd een biljet voor de camera, de app herkent het vanzelf. Of tik in het midden van het scherm om meteen te scannen. ' +
      'Onder de grote knop staan Automatisch, Herhaal, Luisteren en Tellen. Onderaan staan Scannen, Instellingen en Hulp.',
    settings:
      'Instellingen. Van boven naar onder: spreeksnelheid, volume, geluidjes, trillen, kleuren, de uitleg opnieuw beluisteren, en je gegevens wissen. ' +
      'Tik een knop één keer aan om te horen wat hij doet.',
    help: 'Hulp en privacy. Bovenaan staat de knop Lees deze pagina voor. Tik erop om de hele uitleg te horen.',
    notFound: 'Deze pagina bestaat niet. Tik onderaan links op Scannen om terug te gaan.',
  },

  /** Tap once to hear, tap again to use. */
  guide: {
    again: 'Tik nog eens om te gebruiken.',
    openLink: (name: string) => `${name}. Tik nog eens om te openen.`,
    toggle: (name: string, on: boolean) =>
      `${name}, staat ${on ? 'aan' : 'uit'}. Tik nog eens om ${on ? 'uit' : 'aan'} te zetten.`,
    choice: (name: string, checked: boolean) =>
      `${name}, ${checked ? 'gekozen' : 'niet gekozen'}. Tik nog eens om te kiezen.`,
    check: (name: string, checked: boolean) =>
      `${name}, staat ${checked ? 'aan' : 'uit'}. Tik nog eens om ${checked ? 'uit' : 'aan'} te zetten.`,
    button: (name: string) => `${name}. Tik nog eens om te gebruiken.`,
    expand: (name: string, open: boolean) => `${name}. Tik nog eens om ${open ? 'dicht te klappen' : 'open te klappen'}.`,
  },

  readPage: 'Lees deze pagina voor',

  scan: {
    askButton: 'Welk biljet is dit?',
    askHint: 'Tik om te vragen. Lang indrukken om te spreken.',
    asking: 'Even kijken…',
    repeat: 'Herhaal',
    listening: 'Luisteren',
    counting: 'Tellen',
    auto: 'Automatisch',
    autoWatching: 'Houd een biljet voor de camera.',
    torch: 'Lamp',
    resetTotal: 'Totaal wissen',
    totalLabel: 'Totaal geteld',
    cameraOff: 'De camera staat uit. Druk op de grote knop om te starten.',
    cameraStarting:
      'Je telefoon vraagt nu toegang tot de camera. Tik op Toestaan. Die knop staat meestal in de onderste helft van het scherm.',
    cameraReady: 'De camera staat aan.',
    controls: 'Bediening',
    confidenceTitle: 'Modelzekerheid voor begeleiders',
  },

  answer: {
    note: (value: number, certain: boolean) =>
      `Dit is een biljet van ${euroWords(value)}. ${certain ? 'Ik ben er zeker van.' : 'Ik ben er vrij zeker van.'}`,
    unsure: (value: number) =>
      `Ik denk ${euroWords(value)}, maar ik ben niet zeker. Houd het biljet stil en plat, ongeveer twintig centimeter voor de camera.`,
    unclear:
      'Ik zie een biljet, maar ik kan het niet goed lezen. Houd het stil, plat en iets dichter bij de camera.',
    none: 'Ik zie geen biljet. Houd een biljet plat voor de camera.',
    dark: 'Het is erg donker. Zet de lamp aan of zoek meer licht.',
    total: (total: number) => `Totaal ${euroWords(total)}.`,
    totalNow: (total: number) => `Het totaal bedrag is ${euroWords(total)}.`,
    totalNothing: 'Je hebt nog niets geteld. Zet Tellen aan en laat je biljetten één voor één herkennen.',
  },


  toggles: {
    countingOn: (total: number) => `Tellen aan. Totaal ${euroWords(total)}.`,
    countingOff: 'Tellen uit.',
    autoOn: 'Automatisch aan. Houd een biljet voor de camera, de app herkent het vanzelf.',
    autoOff: 'Automatisch uit. Tik op de grote knop om een biljet te laten herkennen.',
    listeningOn:
      'Ik luister. Vraagt je telefoon toegang tot de microfoon, tik dan op Toestaan. Zeg daarna bijvoorbeeld: welk biljet is dit.',
    listeningOff: 'Ik luister niet meer.',
    torchOn: 'Lamp aan.',
    torchOff: 'Lamp uit.',
    torchUnavailable: 'Deze camera heeft geen lamp.',
    resetConfirm: 'Druk nog eens om het totaal te wissen.',
    resetDone: 'Totaal gewist.',
    stopped: 'Gestopt.',
  },

  errors: {
    model: 'Het herkenningsmodel kon niet geladen worden. Controleer je internetverbinding en probeer opnieuw.',
    cameraDenied: 'Ik heb geen toegang tot de camera. Sta de camera toe in de instellingen van je browser.',
    cameraMissing: 'Ik vind geen camera op dit toestel.',
    cameraInsecure: 'De camera werkt alleen via een beveiligde verbinding. Open de app via https.',
    camera: 'De camera kon niet starten. Sluit andere apps die de camera gebruiken en probeer opnieuw.',
    voiceUnsupported: 'Spraakbediening werkt niet in deze browser. Gebruik de grote knop.',
    voiceDenied: 'Ik heb geen toegang tot de microfoon. Sta de microfoon toe of gebruik de grote knop.',
  },

  voiceHelp:
    'Je kan zeggen: welk biljet is dit. Herhaal. Totaal. Wis totaal. Tellen aan of uit. Automatisch aan of uit. Lamp aan of uit. Help. Of stop.',

  commandList: [
    ['Welk biljet is dit? / Wat is dit?', 'Herkent het biljet voor de camera'],
    ['Herhaal', 'Zegt het laatste antwoord opnieuw'],
    ['Wat is het totaal bedrag? / Totaal', 'Zegt hoeveel je samen geteld hebt'],
    ['Wis totaal', 'Zet het totaal terug op nul'],
    ['Tellen aan / uit', 'Telt elk herkend biljet op'],
    ['Automatisch aan / uit', 'Herkent een biljet vanzelf zodra je het voor de camera houdt'],
    ['Lamp aan / uit', 'Zet de zaklamp van je telefoon aan of uit'],
    ['Help', 'Zegt welke opdrachten er zijn'],
    ['Stop', 'Stopt met praten'],
  ] as const,

  settings: {
    speechSection: 'Spraak',
    rate: 'Spreeksnelheid',
    volume: 'Volume',
    feedbackSection: 'Geluid en trillen',
    sounds: 'Korte geluidjes',
    vibration: 'Trillen',
    vibrationHint: 'Vijf euro: één keer. Tien euro: twee keer. Twintig euro: drie keer. Vijftig euro: vier keer.',
    displaySection: 'Weergave',
    theme: 'Kleuren',
    themeDark: 'Geel op zwart',
    themeLight: 'Zwart op wit',
    recognitionSection: 'Herkenning',
    threshold: (pct: number) => `De app noemt een bedrag pas met zekerheid vanaf ${pct} procent.`,
    onboarding: 'Uitleg opnieuw beluisteren',
    dataSection: 'Mijn gegevens',
    deleteData: 'Wis al mijn gegevens',
    deleteConfirm: 'Druk nog eens om al je opgeslagen scans definitief te wissen.',
    storedCloud: 'Herkende bedragen worden anoniem bewaard in de cloud.',
    storedLocal: 'Herkende bedragen worden alleen op dit toestel bewaard.',
    deleteDone: 'Al je gegevens zijn gewist.',
    saved: 'Opgeslagen.',
  },


  help: {
    howTitle: 'Zo gebruik je GeldScan',
    how: [
      'Open de app en tik op het startscherm. Sta de camera toe als je telefoon dat vraagt.',
      'Houd een biljet plat, ongeveer twintig centimeter voor de camera aan de achterkant. Zorg voor licht; zet zo nodig de lamp aan.',
      'Automatisch staat standaard aan: zodra de app een biljet ziet hoor je een kort geluidje. Houd het biljet dan twee seconden stil. Daarna zegt de app het bedrag.',
      'Wil je niet wachten, tik dan op de grote knop: welk biljet is dit. Dan scant de app meteen.',
      'Je telefoon trilt ook: één keer voor vijf euro, twee keer voor tien, drie keer voor twintig, vier keer voor vijftig.',
      'Biljetten tellen: zet Tellen aan en houd je biljetten één voor één voor de camera. Na elk biljet hoor je het nieuwe totaal. Leg elk biljet even weg voor je het volgende toont, ook als het hetzelfde bedrag is.',
      'Zie je niets gebeuren? Na tien seconden zonder biljet zegt de app: ik zie geen biljet.',
    ],
    voiceTitle: 'Spraakopdrachten',
    voiceIntro: 'Zet Luisteren aan, of houd de grote knop lang ingedrukt, en zeg een van deze zinnen:',
    privacyTitle: 'Privacy',
    privacy: [
      'De camerabeelden worden alleen in het geheugen van je toestel verwerkt. Ze worden nooit opgeslagen of verstuurd.',
      'Opgeslagen worden alleen: het bedrag, hoe zeker de app was en het tijdstip, onder een anonieme code. Geen naam, geen e-mail, geen beelden.',
      'Spraakbediening staat standaard uit. Zet je ze aan, dan verwerkt je browser je stem. In Chrome gebeurt dat via de spraakdienst van Google.',
      'Je kan al je gegevens wissen in de instellingen.',
    ],
    disclaimerTitle: 'Let op',
    disclaimer:
      'GeldScan is een schoolproject. De app kan zich vergissen en herkent geen vals geld. Gebruik ze niet als enige controle bij betalingen.',
  },

  notFound: 'Deze pagina bestaat niet.',
  backHome: 'Terug naar scannen',
}
