import { describe, expect, it } from 'vitest'
import { parseCommand } from '@/lib/commands'

describe('parseCommand', () => {
  it.each([
    ['Welk biljet is dit?', 'ask'],
    ['wat biljet is dit', 'ask'],
    ['Welke biljet is dat', 'ask'],
    ['welk bijlet is dit', 'ask'],
    ['wat voor briefje is dit', 'ask'],
    ['Wat is dit?', 'ask'],
    ['hoeveel is dit', 'ask'],
    ['scan', 'ask'],
    ['kijk', 'ask'],
    ['herhaal', 'repeat'],
    ['kan je dat nog eens zeggen', 'repeat'],
    ['totaal', 'total'],
    ['Wat is het totaal bedrag?', 'total'],
    ['wat is het totaalbedrag', 'total'],
    ['wat is het totale bedrag', 'total'],
    ['hoeveel is het samen', 'total'],
    ['hoeveel geld heb ik', 'total'],
    ['wis het totaalbedrag', 'resetTotal'],
    ['hoeveel heb ik', 'total'],
    ['wis totaal', 'resetTotal'],
    ['reset', 'resetTotal'],
    ['tellen aan', 'countingOn'],
    ['tellen uit', 'countingOff'],
    ['lamp aan', 'torchOn'],
    ['zet het licht aan', 'torchOn'],
    ['lamp uit', 'torchOff'],
    ['help', 'help'],
    ['wat kan ik zeggen', 'help'],
    ['stop', 'stop'],
    ['stil', 'stop'],
    // natural phrasings
    ['stop met tellen', 'countingOff'],
    ['stop tellen', 'countingOff'],
    ['niet meer tellen', 'countingOff'],
    ['tellen stoppen', 'countingOff'],
    ['begin met tellen', 'countingOn'],
    ['tel mee', 'countingOn'],
    ['stop met praten', 'stop'],
    ['hou je mond', 'stop'],
    ['scan dit', 'ask'],
    ['kijk eens', 'ask'],
    ['herken dit', 'ask'],
    ['lees voor', 'ask'],
    ['lampje aan', 'torchOn'],
    ['zet de zaklamp even aan', 'torchOn'],
    ['doe het licht uit alsjeblieft', 'torchOff'],
    ['totaal wissen', 'resetTotal'],
    ['zet de teller op nul', 'resetTotal'],
    ['begin opnieuw', 'resetTotal'],
  ])('"%s" → %s', (text, intent) => {
    expect(parseCommand(text)).toBe(intent)
  })

  it.each([
    '',
    'goedemorgen',
    'het weer is mooi vandaag',
    // too loose before: these must not clear the total or switch the lamp
    'wis',
    'nul euro',
    'het is nul',
    'het licht in de kamer is aan',
    'stop automatisch',
  ])('"%s" is not a command', (text) => {
    expect(parseCommand(text)).toBeNull()
  })
})
