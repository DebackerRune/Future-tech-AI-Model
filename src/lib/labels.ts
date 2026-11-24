/** Euro value from a Teachable Machine class name ("20 euro" → 20). Classes without a number mean "no banknote". */
export function valueFromLabel(label: string): number | null {
  const match = String(label).match(/\d+/)
  return match ? Number.parseInt(match[0], 10) : null
}

export function isNoteLabel(label: string): boolean {
  return valueFromLabel(label) !== null
}

/** All euro values present in the model, sorted ascending. */
export function noteValues(labels: readonly string[]): number[] {
  return [...new Set(labels.map(valueFromLabel).filter((v): v is number => v !== null))].sort((a, b) => a - b)
}
