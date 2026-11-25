import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { readJson, writeJson } from '@/lib/storage'

const KEY = 'geldscan.counter.v1'

interface CounterState {
  counting: boolean
  total: number
}

/**
 * Counting mode and the running total. Lives outside the scan page and is saved on the device,
 * so the total survives switching pages (e.g. opening Hulp halfway) and reloading the app.
 */
export const useCounter = defineStore('counter', () => {
  const saved = readJson<CounterState>(KEY, { counting: false, total: 0 })
  const counting = ref(Boolean(saved.counting))
  const total = ref(Number.isFinite(saved.total) && saved.total >= 0 ? saved.total : 0)

  watch([counting, total], () => writeJson(KEY, { counting: counting.value, total: total.value }))

  /** Add a recognised note; returns the new total. */
  function add(value: number): number {
    total.value += value
    return total.value
  }

  function reset() {
    total.value = 0
  }

  return { counting, total, add, reset }
})
