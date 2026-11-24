import { euroWords } from '@/lib/numberWords'

/** Every visible and spoken text of the app (nl-BE). */
export const nl = {
  appName: 'GeldScan',
  skipLink: 'Ga naar de hoofdknop',

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

  scan: {
    askButton: 'Welk biljet is dit?',
    askHint: 'Tik om te vragen. Lang indrukken om te spreken.',
    asking: 'Even kijken…',
    repeat: 'Herhaal',
    listening: 'Luisteren',
    counting: 'Tellen',
    continuous: 'Automatisch',
    torch: 'Lamp',
    resetTotal: 'Totaal wissen',
    totalLabel: 'Totaal geteld',
    cameraOff: 'De camera staat uit. Druk op de grote knop om te starten.',
    cameraStarting: 'Ik vraag nu toegang tot je camera. Sta de camera toe.',
    cameraReady: 'De camera staat aan.',
    controls: 'Bediening',
    confidenceTitle: 'Modelzekerheid voor begeleiders',
  },

  answer: {
    note: (value: number, certain: boolean) =>
      `Dit is een biljet van ${euroWords(value)}. ${certain ? 'Ik ben er zeker van.' : 'Ik ben er vrij zeker van.'}`,
    noteShort: (value: number) => `${euroWords(value)}.`,
    unsure: (value: number) =>
      `Ik denk ${euroWords(value)}, maar ik ben niet zeker. Houd het biljet plat, ongeveer twintig centimeter voor de camera, en vraag het opnieuw.`,
    none: 'Ik zie geen biljet. Houd het biljet voor de camera en vraag het opnieuw.',
    dark: 'Het is erg donker. Zet de lamp aan of zoek meer licht.',
    total: (total: number) => `Totaal ${euroWords(total)}.`,
    totalNow: (total: number) => `Je hebt samen ${euroWords(total)} geteld.`,
  },

  hints: {
    noNote: 'Geen biljet gevonden. Houd het biljet plat, ongeveer twintig centimeter voor de camera.',
    unsure: 'Niet zeker. Draai het biljet of houd het iets verder weg.',
  },

  toggles: {
    countingOn: (total: number) => `Tellen aan. Totaal ${euroWords(total)}.`,
    countingOff: 'Tellen uit.',
    continuousOn: 'Automatisch aan. Houd een biljet voor de camera.',
    continuousOff: 'Automatisch uit.',
    listeningOn: 'Ik luister. Zeg bijvoorbeeld: welk biljet is dit.',
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
    ['Totaal', 'Zegt hoeveel je samen geteld hebt'],
    ['Wis totaal', 'Zet het totaal terug op nul'],
    ['Tellen aan / uit', 'Telt elk herkend biljet op'],
    ['Automatisch aan / uit', 'Zegt een biljet vanzelf, zonder te vragen'],
    ['Lamp aan / uit', 'Zet de zaklamp van je telefoon aan of uit'],
    ['Help', 'Zegt welke opdrachten er zijn'],
    ['Stop', 'Stopt met praten'],
  ] as const,

  settings: {
    speechSection: 'Spraak',
    speechMode: 'Wie leest de antwoorden voor?',
    speechApp: 'De app praat zelf',
    speechReader: 'Alleen mijn schermlezer',
    rate: 'Spreeksnelheid',
    volume: 'Volume',
    voice: 'Stem',
    voiceDefault: 'Standaard Nederlandse stem',
    test: 'Test de stem',
    testText: 'Dit is een biljet van twintig euro.',
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
    onboarding: 'Uitleg opnieuw starten',
    dataSection: 'Mijn gegevens',
    deleteData: 'Wis al mijn gegevens',
    deleteConfirm: 'Druk nog eens om al je opgeslagen scans definitief te wissen.',
    storedCloud: 'Herkende bedragen worden anoniem bewaard in de cloud.',
    storedLocal: 'Herkende bedragen worden alleen op dit toestel bewaard.',
    deleteDone: 'Al je gegevens zijn gewist.',
    saved: 'Opgeslagen.',
  },

  onboarding: {
    title: 'Welkom bij GeldScan',
    next: 'Volgende',
    skip: 'Uitleg overslaan',
    done: 'Begin',
    step: (n: number, total: number) => `Stap ${n} van ${total}`,
    steps: [
      'GeldScan herkent eurobiljetten met de camera van je telefoon en zegt het bedrag.',
      'Houd het biljet plat, ongeveer twintig centimeter voor de camera aan de achterkant van je telefoon. Zorg voor genoeg licht.',
      'Druk op de grote knop: welk biljet is dit. Of zet Luisteren aan en vraag het hardop. De app kijkt even en zegt dan het antwoord.',
      'Je kan ook zeggen: herhaal, totaal, tellen aan, lamp aan of help.',
      'Privacy: de camerabeelden blijven op je toestel. Als je spraakbediening gebruikt, verwerkt je browser je stem, in Chrome via Google. Alleen het herkende bedrag wordt anoniem bewaard.',
      'Wil je dat de app zelf praat, of gebruik je liever alleen je schermlezer? Je kan dit later wijzigen in de instellingen.',
    ],
  },

  help: {
    howTitle: 'Zo gebruik je GeldScan',
    how: [
      'Open de app en druk op de grote knop: welk biljet is dit.',
      'Sta de camera toe als je browser dat vraagt.',
      'Houd het biljet plat, ongeveer twintig centimeter voor de camera aan de achterkant. Zorg voor licht; zet zo nodig de lamp aan.',
      'De app kijkt ongeveer één seconde en zegt dan het bedrag. Je telefoon trilt ook: één keer voor vijf euro, twee keer voor tien, drie keer voor twintig, vier keer voor vijftig.',
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
