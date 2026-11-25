import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useCounter } from '@/stores/counter'
import { nl } from '@/i18n/nl'

describe('counter (Tellen)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('adds notes one by one and the spoken text ends with the new total', () => {
    const c = useCounter()
    c.counting = true
    expect(`${nl.answer.note(20, true)} ${nl.answer.total(c.add(20))}`).toBe(
      'Dit is een biljet van twintig euro. Ik ben er zeker van. Totaal twintig euro.',
    )
    expect(nl.answer.total(c.add(5))).toBe('Totaal vijfentwintig euro.')
    expect(nl.answer.total(c.add(50))).toBe('Totaal vijfenzeventig euro.')
  })

  it('keeps the total when the page changes or the app reloads', async () => {
    const c = useCounter()
    c.counting = true
    c.add(20)
    c.add(10)
    await nextTick()
    // a fresh store (new page / reload) reads the saved state back
    setActivePinia(createPinia())
    const again = useCounter()
    expect(again.total).toBe(30)
    expect(again.counting).toBe(true)
  })

  it('reset sets the total back to zero', async () => {
    const c = useCounter()
    c.add(50)
    c.reset()
    await nextTick()
    setActivePinia(createPinia())
    expect(useCounter().total).toBe(0)
  })

  it('answers "wat is het totaal bedrag"', () => {
    expect(nl.answer.totalNow(75)).toBe('Het totaal bedrag is vijfenzeventig euro.')
  })
})
