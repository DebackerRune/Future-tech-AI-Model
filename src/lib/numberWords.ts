const UNITS = [
  'nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen',
  'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien',
]
const TENS: Record<number, string> = {
  2: 'twintig', 3: 'dertig', 4: 'veertig', 5: 'vijftig', 6: 'zestig', 7: 'zeventig', 8: 'tachtig', 9: 'negentig',
}

function below100(n: number): string {
  if (n < 20) return UNITS[n]
  const tens = TENS[Math.floor(n / 10)]
  const unit = n % 10
  if (unit === 0) return tens
  const unitWord = UNITS[unit]
  // "tweeëntwintig", "drieëntwintig": a trema when the unit ends in -e
  return unitWord + (unitWord.endsWith('e') ? 'ën' : 'en') + tens
}

function below1000(n: number): string {
  if (n < 100) return below100(n)
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const prefix = hundreds === 1 ? 'honderd' : UNITS[hundreds] + 'honderd'
  return rest === 0 ? prefix : prefix + below100(rest)
}

/** Dutch number words for 0 – 999 999, e.g. 55 → "vijfenvijftig". Used so speech never reads "€" or digits oddly. */
export function dutchNumber(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999) return String(n)
  if (n < 1000) return below1000(n)
  const thousands = Math.floor(n / 1000)
  const rest = n % 1000
  const prefix = thousands === 1 ? 'duizend' : below1000(thousands) + 'duizend'
  return rest === 0 ? prefix : `${prefix} ${below1000(rest)}`
}

export function euroWords(n: number): string {
  return `${dutchNumber(n)} euro`
}
