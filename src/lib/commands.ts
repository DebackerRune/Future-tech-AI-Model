export type Intent =
  | 'ask'
  | 'repeat'
  | 'total'
  | 'resetTotal'
  | 'countingOn'
  | 'countingOff'
  | 'continuousOn'
  | 'continuousOff'
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

// Order matters: specific phrases first.
const RULES: [Intent, RegExp][] = [
  ['resetTotal', /\b(wis|wissen|reset|herstart|leeg|nul)\b.*\b(totaal|teller)?\b|^reset$/],
  ['countingOn', new RegExp(`\\b(tellen|teller|optellen)\\b.*\\b${ON}\\b|\\b(begin|start)\\b.*\\btellen\\b`)],
  ['countingOff', new RegExp(`\\b(tellen|teller|optellen)\\b.*\\b${OFF}\\b`)],
  ['continuousOn', new RegExp(`\\b(automatisch|automaat|doorlopend)\\b.*\\b${ON}\\b`)],
  ['continuousOff', new RegExp(`\\b(automatisch|automaat|doorlopend)\\b.*\\b${OFF}\\b`)],
  ['torchOn', new RegExp(`\\b(lamp|licht|zaklamp|flits)\\b.*\\b${ON}\\b`)],
  ['torchOff', new RegExp(`\\b(lamp|licht|zaklamp|flits)\\b.*\\b${OFF}\\b`)],
  ['total', /\b(totaal|hoeveel heb ik|hoeveel geld|samen)\b/],
  ['help', /\b(help|hulp|wat kan ik zeggen|commandos?|opdrachten)\b/],
  ['repeat', /\b(herhaal|herhalen|nog eens|nog een keer|opnieuw zeggen|wat zei je|pardon)\b/],
  ['ask', new RegExp(`\\b(welk|welke|wat|wat voor|hoeveel)\\b.*\\b${NOTE}\\b`)],
  ['ask', new RegExp(`\\b${NOTE}\\b`)],
  ['ask', /^(wat is dit|wat is het|wat is dat|wat zie je|hoeveel is dit|hoeveel is het|scan|scannen|kijk|kijken|lees|lees voor|herken)$/],
  ['ask', /\b(wat is dit|wat zie je|hoeveel is dit|hoeveel is dat)\b/],
  ['stop', /^(stop|stil|zwijg|hou op|ophouden|genoeg)$/],
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
