import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { nl } from '@/i18n/nl'
import { useAnnouncer } from '@/stores/announcer'
import { useSettings } from '@/stores/settings'
import { useSpeech } from '@/composables/useSpeech'
import ScanPage from '@/pages/ScanPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    /** Spoken when the page opens: what is on it and where */
    intro: string
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'scan', component: ScanPage, meta: { title: nl.titles.scan, intro: nl.pageIntro.scan } },
    {
      path: '/instellingen',
      name: 'settings',
      component: () => import('@/pages/SettingsPage.vue'),
      meta: { title: nl.titles.settings, intro: nl.pageIntro.settings },
    },
    {
      path: '/hulp',
      name: 'help',
      component: () => import('@/pages/HelpPage.vue'),
      meta: { title: nl.titles.help, intro: nl.pageIntro.help },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { title: nl.titles.notFound, intro: nl.pageIntro.notFound },
    },
  ],
})

let firstLoad = true

// Accessible route changes: update the title, move focus to the page heading, and say what the
// page contains (spoken by the app itself, or only announced to the screen reader).
router.afterEach(async (to) => {
  document.title = `${to.meta.title} – ${nl.appName}`
  if (firstLoad) {
    firstLoad = false
    return // on first load the start screen explains everything
  }
  await nextTick()
  document.getElementById('page-title')?.focus()
  if (useSettings().appSpeech) useSpeech().say(to.meta.intro)
  else useAnnouncer().announce(nl.pageOpened(to.meta.title), 'polite')
})
