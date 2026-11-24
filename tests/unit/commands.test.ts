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
    ['hoeveel heb ik', 'total'],
    ['wis totaal', 'resetTotal'],
    ['reset', 'resetTotal'],
    ['tellen aan', 'countingOn'],
    ['tellen uit', 'countingOff'],
    ['automatisch aan', 'continuousOn'],
    ['automatisch uit', 'continuousOff'],
    ['lamp aan', 'torchOn'],
    ['zet het licht aan', 'torchOn'],
    ['lamp uit', 'torchOff'],
    ['help', 'help'],
    ['wat kan ik zeggen', 'help'],
    ['stop', 'stop'],
    ['stil', 'stop'],
  ])('"%s" → %s', (text, intent) => {
    expect(parseCommand(text)).toBe(intent)
  })

  it.each(['', 'goedemorgen', 'het weer is mooi vandaag'])('"%s" is not a command', (text) => {
    expect(parseCommand(text)).toBeNull()
  })
})
