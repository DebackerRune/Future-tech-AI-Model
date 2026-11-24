import { onBeforeUnmount } from 'vue'

/** Keeps the screen on while active; re-acquires the lock when the page becomes visible again. */
export function useWakeLock() {
  let lock: WakeLockSentinel | null = null
  let wanted = false

  async function acquire() {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
    try {
      lock = await navigator.wakeLock.request('screen')
    } catch {
      lock = null
    }
  }

  function onVisible() {
    if (wanted && document.visibilityState === 'visible' && !lock) void acquire()
  }
  document.addEventListener('visibilitychange', onVisible)

  async function enable() {
    wanted = true
    if (!lock) await acquire()
  }

  async function disable() {
    wanted = false
    try {
      await lock?.release()
    } catch {
      /* already released */
    }
    lock = null
  }

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisible)
    void disable()
  })

  return { enable, disable }
}
