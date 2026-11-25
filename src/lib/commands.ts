export type Intent =
  | 'ask'
  | 'repeat'
  | 'total'
  | 'resetTotal'
  | 'countingOn'
  | 'countingOff'
  | 'torchOn'
  | 'torchOff'
  | 'help'
  | 'stop'

/** Lowercase, strip accents and punctuation, collapse spaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Speech recognisers often mishear "biljet" — accept the usual variants.
const NOTE = '(biljet|biljetten|bijlet|billet|bilje|briefje|brief|bankbiljet|geldbriefje|biljart|bielet|bil jet)'
const ON = '(aan|in|starten|start|aanzetten)'
const OFF = '(uit|stop|stoppen|uitzetten)'
const TORCH = '(lamp|lampje|licht|lichtje|zaklamp|flits|flitser|flitslicht)'
const POLITE = '( (alsjeblieft|alstublieft|aub|graag))?'

// Order matters: specific phrases first.
const RULES: [Intent, RegExp][] = [
  // Only with "totaal"/"teller"/"alles": a lone "wis" or "nul" in another sentence must not clear the total.
  ['resetTotal', /\b(wis|wissen|reset|resetten|leeg|leegmaken)\b.*\b(totaal\w*|teller|alles)\b/],
  ['resetTotal', /\b(totaal\w*|teller)\b.*\b(wissen|resetten|leegmaken|op nul|naar nul)\b/],
  ['resetTotal', /^(reset|begin opnieuw|opnieuw beginnen)$/],
  // "stop met tellen" (off word first) as well as "tellen uit" (off word last)
  [
    'countingOff',
    new RegExp(String.raw`\b(stop|stoppen|niet meer)\b.*\b(tellen|optellen)\b|\b(tellen|teller|optellen)\b.*\b${OFF}\b`),
  ],
  [
    'countingOn',
    new RegExp(String.raw`\b(tellen|teller|optellen)\b.*\b${ON}\b|\b(begin|start)\b.*\btellen\b|^(tel mee|ik wil tellen)$`),
  ],
  // The whole phrase must be about the lamp, so "het licht in de kamer is aan" does nothing.
  ['torchOn', new RegExp(`^((zet|doe) )?((de|het|je) )?${TORCH} ((eens|even|maar) )?${ON}${POLITE}$`)],
  ['torchOff', new RegExp(`^((zet|doe) )?((de|het|je) )?${TORCH} ((eens|even|maar) )?${OFF}${POLITE}$`)],
  // "wat is het totaal bedrag", "totaalbedrag" (often written as one word), "hoeveel is het samen", …
  ['total', /\b(totaal\w*|totale|hoeveel heb ik|hoeveel geld|samen|opgeteld)\b|^wat heb ik$/],
  ['help', /\b(help|hulp|wat kan ik zeggen|commandos?|opdrachten)\b/],
  ['repeat', /\b(herhaal|herhalen|nog eens|nog een keer|opnieuw zeggen|wat zei je|pardon)\b/],
  ['stop', /^(stop|stil|zwijg|hou op|ophouden|genoeg|wees stil|hou je mond)$|\b(stop met praten|niet meer praten)\b/],
  ['ask', new RegExp(String.raw`\b(welk|welke|wat|wat voor|hoeveel)\b.*\b${NOTE}\b`)],
  ['ask', new RegExp(String.raw`\b${NOTE}\b`)],
  ['ask', /^(wat is dit|wat is het|wat is dat|wat zie je|hoeveel is dit|hoeveel is het)$/],
  // "scan", "scan dit", "kijk eens", "herken dit", "lees voor", …
  ['ask', /^(scan|scannen|kijk|kijken|lees|lees voor|herken|herkennen)( (dit|dat|het|eens|maar|nu|even|voor))*$/],
  ['ask', /\b(wat is dit|wat zie je|hoeveel is dit|hoeveel is dat)\b/],
]

/** Map a spoken phrase to an app intent, or null when it isn't a command. */
export function parseCommand(text: string): Intent | null {
  const t = normalize(text)
  if (!t) return null
  for (const [intent, re] of RULES) {
    if (re.test(t)) return intent
  }
  return null
}
