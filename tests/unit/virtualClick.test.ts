import { afterEach, describe, expect, it, vi } from 'vitest'
import { isRealTouch, isScreenReaderClick, isVirtualClick, isVirtualPointerEvent } from '@/lib/virtualClick'

const ua = (value: string) => vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(value)
const coarse = (matches: boolean) =>
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as MediaQueryList)

function click(init: { detail?: number; buttons?: number; pointerType?: string }) {
  const e = new MouseEvent('click', { detail: init.detail ?? 1, buttons: init.buttons ?? 0 })
  if (init.pointerType !== undefined) Object.defineProperty(e, 'pointerType', { value: init.pointerType })
  return e
}

function pointer(init: { width: number; height: number; pressure: number; detail?: number; pointerType: string }) {
  const e = new MouseEvent('pointerdown', { detail: init.detail ?? 0 }) as PointerEvent
  for (const [k, v] of Object.entries(init)) if (k !== 'detail') Object.defineProperty(e, k, { value: v })
  return e
}

afterEach(() => vi.restoreAllMocks())

describe('screen reader detection', () => {
  it('a normal finger tap is not virtual', () => {
    ua('Mozilla/5.0 (iPhone)')
    coarse(true)
    expect(isVirtualClick(click({ detail: 1 }))).toBe(false)
    expect(isScreenReaderClick(click({ detail: 1 }), false)).toBe(false)
  })

  it('a click with detail 0 and no pointer type is virtual (VoiceOver, NVDA)', () => {
    ua('Mozilla/5.0 (iPhone)')
    coarse(true)
    expect(isScreenReaderClick(click({ detail: 0 }), false)).toBe(true)
  })

  it('Android TalkBack double-tap: click with pressed button and a pointer type', () => {
    ua('Mozilla/5.0 (Linux; Android 14)')
    coarse(true)
    expect(isVirtualClick(click({ detail: 1, buttons: 1, pointerType: 'mouse' }))).toBe(true)
    expect(isVirtualClick(click({ detail: 1, buttons: 0, pointerType: 'touch' }))).toBe(false)
  })

  it('TalkBack pointerdown of 1×1 px without pressure is virtual', () => {
    ua('Mozilla/5.0 (Linux; Android 14)')
    expect(isVirtualPointerEvent(pointer({ width: 1, height: 1, pressure: 0, pointerType: 'mouse' }))).toBe(true)
    expect(isVirtualPointerEvent(pointer({ width: 24, height: 24, pressure: 0.5, pointerType: 'touch' }))).toBe(false)
  })

  it('a real finger touch always wins, even if the click itself looks virtual', () => {
    ua('Mozilla/5.0 (Linux; Android 14)')
    coarse(true)
    const touch = pointer({ width: 18, height: 18, pressure: 0.6, pointerType: 'touch' })
    expect(isRealTouch(touch)).toBe(true)
    expect(isScreenReaderClick(click({ detail: 1, buttons: 1, pointerType: 'mouse' }), false, true)).toBe(false)
  })

  it('a keyboard Enter on a desktop is not treated as a screen reader', () => {
    ua('Mozilla/5.0 (Windows NT 10.0)')
    coarse(false)
    expect(isScreenReaderClick(click({ detail: 0 }), false)).toBe(false)
  })
})
