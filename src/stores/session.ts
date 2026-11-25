import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * State for this visit only (not saved). `started` turns true after the tap on the start screen:
 * only then may the app talk and start the camera (browsers require that first tap).
 */
export const useSession = defineStore('session', () => {
  const started = ref(false)
  /** Automatic mode: always on at the start of a visit; "automatisch uit" pauses it for this visit only. */
  const autoScan = ref(true)
  return { started, autoScan }
})
