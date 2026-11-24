import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { nl } from '@/i18n/nl'
import { useAnnouncer } from '@/stores/announcer'
import ScanPage from '@/pages/ScanPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'scan', component: ScanPage, meta: { title: nl.titles.scan } },
    {
      path: '/instellingen',
      name: 'settings',
      component: () => import('@/pages/SettingsPage.vue'),
      meta: { title: nl.titles.settings },
    },
    { path: '/hulp', name: 'help', component: () => import('@/pages/HelpPage.vue'), meta: { title: nl.titles.help } },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { title: nl.titles.notFound },
    },
  ],
})

let firstLoad = true

// Accessible route changes: update the title, move focus to the page heading and announce it.
router.afterEach(async (to) => {
  document.title = `${to.meta.title} – ${nl.appName}`
  if (firstLoad) {
    firstLoad = false
    return // on first load the scan page focuses its main button itself
  }
  await nextTick()
  const heading = document.getElementById('page-title')
  heading?.focus()
  useAnnouncer().announce(nl.pageOpened(to.meta.title), 'polite')
})
