import { onBeforeUnmount, ref, shallowRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { nl } from '@/i18n/nl'
import { aggregatePredictions, type Aggregate, type ClassPrediction } from '@/lib/aggregate'
import { decideAnswer, THRESHOLD, type Answer } from '@/lib/decide'
import { noteValues } from '@/lib/labels'
import { euroWords } from '@/lib/numberWords'
import { AutoScanner } from '@/lib/autoScan'
import { usePoints } from '@/stores/points'
import { useCounter } from '@/stores/counter'
import { useSession } from '@/stores/session'
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
/** Automatic mode: how often a frame is checked while watching, and while scanning (2 s). */
const WATCH_INTERVAL_MS = 250
const AUTO_SCAN_INTERVAL_MS = 120
const DARK_LUMINANCE = 45

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Everything that happens on the scan page: automatic mode, the button, counting, torch. */
export function useScanner(video: Ref<HTMLVideoElement | null>) {
  const camera = useCamera()
  const model = useModel()
  const speech = useSpeech()
  const earcons = useEarcons()
  const haptics = useHaptics()
  const wakeLock = useWakeLock()
  const points = usePoints()
  const session = useSession()

  const busy = ref(false)
  const resultText = ref<string>(nl.scan.cameraOff)
  const perClass = shallowRef<ClassPrediction[]>([])
  // Counting state lives in a store so the total survives page changes and reloads.
  const counter = useCounter()
  const { counting, total } = storeToRefs(counter)
  const resetArmed = ref(false)

  /** Automatic mode is running (camera on, frames being watched). */
  const autoRunning = ref(false)
  const auto = new AutoScanner(Date.now())
  let autoTimer: ReturnType<typeof setTimeout> | undefined
  let autoLum = 0
  let autoLumFrames = 0

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

  function onConfidentNote(label: string, value: number, confidence: number, certain: boolean) {
    haptics.note(value)
    earcons.play('found')
    let text = nl.answer.note(value, certain)
    if (counting.value) {
      // Say the new total right after the note: "… twintig euro. Totaal vijfenveertig euro."
      text += ` ${nl.answer.total(counter.add(value))}`
    }
    say(text)
    // Stored silently in the backend (assignment requirement: points only above 90 %).
    if (confidence >= THRESHOLD) {
      void points.record(label, value, confidence, counting.value ? 'counting' : 'ask', noteValues(model.labels.value))
    }
  }

  /** Say the answer for a finished scan (button or automatic). Same wording for both. */
  function speakAnswer(agg: Aggregate, answer: Answer, dark: boolean) {
    perClass.value = agg.perClass
    const darkHint = dark ? ` ${nl.answer.dark}` : ''
    if (answer.kind === 'note') {
      onConfidentNote(agg.label, answer.value, answer.confidence, answer.certain)
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

  /** Button / "Welk biljet is dit?": scan right away (~1.2 s), also while automatic mode runs. */
  async function ask(): Promise<void> {
    if (busy.value) return
    busy.value = true
    auto.cancelScan()
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

      speakAnswer(agg, answer, frames.length > 0 && lum / frames.length < DARK_LUMINANCE)
      // Share the memory with automatic mode, so this note isn't answered (or counted) twice.
      auto.markHandled(agg.label, answer.kind, Date.now())
    } finally {
      busy.value = false
    }
  }

  // ---------- Automatic mode ----------

  async function autoTick() {
    if (!autoRunning.value) return
    const v = video.value
    if (!busy.value && v && camera.active.value) {
      const f = await model.predictVideo(v)
      if (f && autoRunning.value && !busy.value) {
        const now = Date.now()
        const event = auto.push(f.predictions, now)
        if (auto.phase === 'scanning') {
          autoLum += f.luminance
          autoLumFrames++
        }
        if (event?.type === 'scanStart') {
          // Something is in view: short sound + tick so the user holds the note still.
          earcons.play('start')
          haptics.tick()
          resultText.value = nl.scan.asking
          autoLum = f.luminance
          autoLumFrames = 1
        } else if (event?.type === 'scanDone') {
          const agg = aggregatePredictions(event.frames)
          const answer = decideAnswer(agg)
          speakAnswer(agg, answer, autoLumFrames > 0 && autoLum / autoLumFrames < DARK_LUMINANCE)
          auto.markHandled(agg.label, answer.kind, now)
        } else if (event?.type === 'noNote') {
          earcons.play('none')
          say(nl.answer.none)
        }
      }
    }
    if (autoRunning.value) {
      autoTimer = setTimeout(autoTick, auto.phase === 'scanning' ? AUTO_SCAN_INTERVAL_MS : WATCH_INTERVAL_MS)
    }
  }

  /** Start watching the camera. `announce` says so (when the user switches it on). */
  async function startAuto(announce = false): Promise<void> {
    if (autoRunning.value) return
    if (!(await ensureReady())) return
    auto.reset(Date.now())
    autoRunning.value = true
    if (announce) say(nl.toggles.autoOn)
    else resultText.value = nl.scan.autoWatching
    void autoTick()
  }

  function stopAuto(announce = false) {
    autoRunning.value = false
    clearTimeout(autoTimer)
    if (announce) say(nl.toggles.autoOff)
  }

  /** Voice command "automatisch aan/uit"; off lasts for this visit only. */
  async function setAuto(on: boolean) {
    session.autoScan = on
    if (on) await startAuto(true)
    else stopAuto(true)
  }

  // ---------- Counting, torch, misc ----------

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
    counter.reset()
    say(nl.toggles.resetDone)
  }

  /** "Wat is het totaal bedrag?" */
  function sayTotal() {
    say(total.value === 0 && !counting.value ? nl.answer.totalNothing : nl.answer.totalNow(total.value))
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
    stopAuto()
    camera.stop(video.value)
    void wakeLock.disable()
  }

  // Stop the camera when the app is hidden; resume (and automatic mode) when it comes back.
  function onVisibility() {
    if (document.visibilityState === 'hidden') {
      resumeOnVisible = camera.active.value || autoRunning.value
      shutdown()
    } else if (resumeOnVisible) {
      resumeOnVisible = false
      if (session.autoScan) void startAuto()
      else
        void ensureReady().then((ok) => {
          if (ok) say(nl.scan.cameraReady, 'normal')
        })
    }
  }
  document.addEventListener('visibilitychange', onVisibility)
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    shutdown()
  })

  return {
    camera,
    model,
    busy,
    resultText,
    perClass,
    counting,
    total,
    resetArmed,
    autoRunning,
    ask,
    repeat,
    startAuto,
    setAuto,
    setCounting,
    resetTotal,
    sayTotal,
    setTorch,
    stopAll,
    say,
    euroWords,
  }
}
