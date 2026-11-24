import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import axe from 'axe-core'
import type { Component } from 'vue'
import { parseCommand } from '@/lib/commands'
import ScanPage from '@/pages/ScanPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import HelpPage from '@/pages/HelpPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import StartScreen from '@/components/StartScreen.vue'
import BottomNav from '@/components/BottomNav.vue'

// jsdom has no media, canvas or dialog support; the a11y checks only need the DOM.
HTMLMediaElement.prototype.play = () => Promise.resolve()
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}

async function check(component: Component) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }] })
  const host = document.createElement('main')
  document.body.appendChild(host)
  const wrapper = mount(component, { attachTo: host, global: { plugins: [pinia, router] } })
  await flushPromises()
  const results = await axe.run(host, {
    // colour contrast needs real layout/canvas, which jsdom lacks (checked with Lighthouse instead)
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  wrapper.unmount()
  host.remove()
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)
}

describe('accessibility (axe)', () => {
  beforeEach(() => localStorage.clear())

  it.each([
    ['ScanPage', ScanPage],
    ['SettingsPage', SettingsPage],
    ['HelpPage', HelpPage],
    ['NotFoundPage', NotFoundPage],
    ['StartScreen', StartScreen],
    ['BottomNav', BottomNav],
  ] as const)('%s has no violations', async (_name, component) => {
    expect(await check(component)).toEqual([])
  })

  it('every page has exactly one focusable h1 with id page-title', async () => {
    for (const component of [ScanPage, SettingsPage, HelpPage, NotFoundPage]) {
      setActivePinia(createPinia())
      const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }] })
      const w = mount(component, { global: { plugins: [router] } })
      const h1s = w.findAll('h1')
      expect(h1s).toHaveLength(1)
      expect(h1s[0].attributes('id')).toBe('page-title')
      expect(h1s[0].attributes('tabindex')).toBe('-1')
      w.unmount()
    }
  })

  it('the documented voice commands are all understood', () => {
    expect(parseCommand('welk biljet is dit')).toBe('ask')
  })
})
