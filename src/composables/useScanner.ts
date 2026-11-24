import { onBeforeUnmount, ref, shallowRef, type Ref } from 'vue'
import { nl } from '@/i18n/nl'
import { aggregatePredictions, type ClassPrediction } from '@/lib/aggregate'
import { ANSWER_THRESHOLD, decideAnswer, THRESHOLD } from '@/lib/decide'
import { noteValues } from '@/lib/labels'
import { StabilityTracker } from '@/lib/stability'
import { euroWords } from '@/lib/numberWords'
import { usePoints } from '@/stores/points'
import type { ScanMode } from '@/firebase/scans'
import { useCamera, type CameraError } from './useCamera'
import { useEarcons } from './useEarcons'
import { useHaptics } from './useHaptics'
import { useModel } from './useModel'
import { useSpeech } from './useSpeech'
import { useWakeLock } from './useWakeLock'

const ASK_FRAMES = 10
/** Extra frames when the first look was unsure, before giving up. */
const RETRY_FRAMES = 8
const ASK_INTERVAL_MS = 120
const CONTINUOUS_INTERVAL_MS = 150
const DARK_LUMINANCE = 45
const HINT_AFTER_MS = 8000
const HINT_QUIET_MS = 16000

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Everything that happens on the scan page: asking, continuous mode, counting, torch. */
export function useScanner(video: Ref<HTMLVideoElement | null>) {
  const camera = useCamera()
  const model = useModel()
  const speech = useSpeech()
  const earcons = useEarcons()
  const haptics = useHaptics()
  const wakeLock = useWakeLock()
  const points = usePoints()

  const busy = ref(false)
  const resultText = ref<string>(nl.scan.cameraOff)
  const perClass = shallowRef<ClassPrediction[]>([])
  const counting = ref(false)
  const continuous = ref(false)
  const total = ref(0)
  const resetArmed = ref(false)

  // Continuous mode speaks from 80 %, like asking; points still need 90 %.
  const tracker = new StabilityTracker({ threshold: ANSWER_THRESHOLD })
  let loopTimer: ReturnType<typeof setTimeout> | undefined
  let lastActivity = 0
  let lastHint = 0
  let resumeOnVisible = false

  function say(text: string, priority: 'high' | 'normal' = 'high') {
    if (priority === 'high') resultText.value = text
    speech.say(text, priority)
  }

  function cameraErrorText(err: CameraError): string {
    return {
      denied: nl.errors.cameraDenied,
      missing: nl.errors.cameraMissing,
      insecure: nl.errors.cameraInsecure,
      other: nl.errors.camera,
    }[err]
  }

  /** Load the model and start the camera if needed. Returns false (after telling the user) on failure. */
  async function ensureReady(): Promise<boolean> {
    try {
      await model.load()
    } catch (e) {
      console.error(e)
      earcons.play('error')
      haptics.error()
      say(nl.errors.model)
      return false
    }
    if (!camera.active.value) {
      if (!video.value) return false
      say(nl.scan.cameraStarting, 'normal')
      const err = await camera.start(video.value)
      if (err) {
        earcons.play('error')
        haptics.error()
        say(cameraErrorText(err))
        return false
      }
      void wakeLock.enable()
      await sleep(400) // let exposure settle
    }
    return true
  }

  async function onConfidentNote(label: string, value: number, confidence: number, mode: ScanMode, fullSentence: boolean, certain: boolean) {
    haptics.note(value)
    earcons.play('found')
    let text = fullSentence ? nl.answer.note(value, certain) : nl.answer.noteShort(value)
    if (counting.value) {
      total.value += value
      text += ` ${nl.answer.total(total.value)}`
    }
    say(text)
    // Stored silently in the backend (assignment requirement: points only above 90 %).
    if (confidence >= THRESHOLD) {
      void points.record(label, value, confidence, counting.value ? 'counting' : mode, noteValues(model.labels.value))
    }
  }

  /** Grab `count` frames; returns their predictions and the summed brightness. */
  async function sample(v: HTMLVideoElement, count: number, into: ClassPrediction[][]): Promise<number> {
    let lum = 0
    for (let i = 0; i < count; i++) {
      const f = await model.predictVideo(v)
      if (f) {
        into.push(f.predictions)
        lum += f.luminance
      }
      await sleep(ASK_INTERVAL_MS)
    }
    return lum
  }

  /** "Welk biljet is dit?" — look ~1.2 s, let the frames vote, and say the most confident answer. */
  async function ask(): Promise<void> {
    if (busy.value) return
    busy.value = true
    try {
      earcons.play('start')
      haptics.tick()
      if (!(await ensureReady()) || !video.value) return
      resultText.value = nl.scan.asking

      const frames: ClassPrediction[][] = []
      let lum = await sample(video.value, ASK_FRAMES, frames)
      let agg = aggregatePredictions(frames)
      let answer = decideAnswer(agg)

      // Not sure yet but a note is on top: look a little longer before answering.
      if ((answer.kind === 'unsure' || answer.kind === 'unclear') && video.value) {
        lum += await sample(video.value, RETRY_FRAMES, frames)
        agg = aggregatePredictions(frames)
        answer = decideAnswer(agg)
      }

      perClass.value = agg.perClass
      const dark = frames.length > 0 && lum / frames.length < DARK_LUMINANCE
      const darkHint = dark ? ` ${nl.answer.dark}` : ''
      lastActivity = Date.now()

      if (answer.kind === 'note') {
        await onConfidentNote(agg.label, answer.value, answer.confidence, 'ask', true, answer.certain)
      } else if (answer.kind === 'unsure') {
        earcons.play('unsure')
        say(nl.answer.unsure(answer.value) + darkHint)
      } else if (answer.kind === 'unclear') {
        earcons.play('unsure')
        say(nl.answer.unclear + darkHint)
      } else {
        earcons.play('none')
        say(nl.answer.none + darkHint)
      }
    } finally {
      busy.value = false
    }
  }

  async function loop() {
    if (!continuous.value || !video.value) return
    if (!busy.value) {
      const f = await model.predictVideo(video.value)
      if (f && f.predictions.length) {
        perClass.value = [...f.predictions].sort((a, b) => b.probability - a.probability)
        const top = perClass.value[0]
        const now = Date.now()
        const stable = tracker.push(top.className, top.probability, now)
        if (stable) {
          lastActivity = now
          await onConfidentNote(stable.label, stable.value, stable.confidence, 'continuous', false, false)
        } else if (now - lastActivity > HINT_AFTER_MS && now - lastHint > HINT_QUIET_MS) {
          lastHint = now
          const unsure = top.probability > 0.5 && top.probability < ANSWER_THRESHOLD && /\d/.test(top.className)
          say(unsure ? nl.hints.unsure : nl.hints.noNote, 'normal')
        }
      }
    }
    if (continuous.value) loopTimer = setTimeout(loop, CONTINUOUS_INTERVAL_MS)
  }

  async function setContinuous(on: boolean) {
    if (on === continuous.value) return
    if (on) {
      if (!(await ensureReady())) return
      continuous.value = true
      tracker.reset()
      lastActivity = Date.now()
      lastHint = 0
      say(nl.toggles.continuousOn)
      void loop()
    } else {
      continuous.value = false
      clearTimeout(loopTimer)
      say(nl.toggles.continuousOff)
    }
  }

  function setCounting(on: boolean) {
    counting.value = on
    resetArmed.value = false
    say(on ? nl.toggles.countingOn(total.value) : nl.toggles.countingOff)
  }

  /** Two-step reset so the total isn't lost by an accidental tap or misheard command. */
  function resetTotal(confirmed = false) {
    if (!confirmed && !resetArmed.value) {
      resetArmed.value = true
      say(nl.toggles.resetConfirm)
      setTimeout(() => (resetArmed.value = false), 6000)
      return
    }
    resetArmed.value = false
    total.value = 0
    say(nl.toggles.resetDone)
  }

  function sayTotal() {
    say(nl.answer.totalNow(total.value))
  }

  async function setTorch(on: boolean) {
    if (!camera.active.value && on && !(await ensureReady())) return
    if (!camera.torchAvailable.value) {
      say(nl.toggles.torchUnavailable)
      return
    }
    const ok = await camera.setTorch(on)
    say(ok ? (on ? nl.toggles.torchOn : nl.toggles.torchOff) : nl.toggles.torchUnavailable)
  }

  function repeat() {
    speech.say(resultText.value)
  }

  function stopAll() {
    speech.stop()
  }

  function shutdown() {
    clearTimeout(loopTimer)
    camera.stop(video.value)
    void wakeLock.disable()
  }

  // Stop the camera when the app is hidden; resume politely when it comes back.
  function onVisibility() {
    if (document.visibilityState === 'hidden') {
      resumeOnVisible = camera.active.value
      shutdown()
    } else if (resumeOnVisible) {
      resumeOnVisible = false
      void ensureReady().then((ok) => {
        if (ok) {
          say(nl.scan.cameraReady, 'normal')
          if (continuous.value) void loop()
        }
      })
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    continuous.value = false
    shutdown()
  })

  return {
    camera,
    model,
    busy,
    resultText,
    perClass,
    counting,
    continuous,
    total,
    resetArmed,
    ask,
    repeat,
    setContinuous,
    setCounting,
    resetTotal,
    sayTotal,
    setTorch,
    stopAll,
    say,
    euroWords,
  }
}
