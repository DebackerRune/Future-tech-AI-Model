import { describe as suite, expect, it } from 'vitest'
import { describe } from '@/composables/useVoiceGuide'

function el(html: string): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = html
  return host.firstElementChild as HTMLElement
}

suite('voice guide: what is said on the first tap', () => {
  it('reads a normal button and asks to tap again', () => {
    expect(describe(el('<button>Herhaal</button>'))).toBe('Herhaal. Tik nog eens om te gebruiken.')
  })

  it('reads the state of a toggle', () => {
    expect(describe(el('<button aria-label="Tellen" aria-pressed="false">Tellen uit</button>'))).toBe(
      'Tellen, staat uit. Tik nog eens om aan te zetten.',
    )
    expect(describe(el('<button aria-label="Tellen" aria-pressed="true">Tellen aan</button>'))).toBe(
      'Tellen, staat aan. Tik nog eens om uit te zetten.',
    )
  })

  it('reads links as something to open', () => {
    expect(describe(el('<a href="/hulp">Hulp</a>'))).toBe('Hulp. Tik nog eens om te openen.')
  })

  it('reads radio choices and checkboxes with their state', () => {
    expect(describe(el('<label><input type="radio" checked /> Geel op zwart</label>'))).toBe(
      'Geel op zwart, gekozen. Tik nog eens om te kiezen.',
    )
    expect(describe(el('<label><input type="checkbox" /> Trillen</label>'))).toBe(
      'Trillen, staat uit. Tik nog eens om aan te zetten.',
    )
  })
})
