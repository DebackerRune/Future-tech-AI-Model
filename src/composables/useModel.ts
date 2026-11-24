import { ref, shallowRef } from 'vue'
import type { CustomMobileNet } from '@teachablemachine/image'
import type { ClassPrediction } from '@/lib/aggregate'

const SIZE = 224
const model = shallowRef<CustomMobileNet | null>(null)
const labels = ref<string[]>([])
const loading = ref(false)
let loadPromise: Promise<void> | null = null

// One reusable in-memory canvas: frames are never stored or sent anywhere.
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

function modelBase(): string {
  const base = import.meta.env.VITE_MODEL_URL || '/model/'
  return base.endsWith('/') ? base : `${base}/`
}

export interface Frame {
  predictions: ClassPrediction[]
  /** average brightness 0..255 of the frame */
  luminance: number
}

/** Loads the Teachable Machine model once (TensorFlow.js is code-split and only loaded here). */
export function useModel() {
  async function load(): Promise<void> {
    if (model.value) return
    loadPromise ??= (async () => {
      loading.value = true
      try {
        // The package is CommonJS: depending on the bundler the API is on the namespace or on `default`.
        const mod = (await import('@teachablemachine/image')) as typeof import('@teachablemachine/image') & {
          default?: typeof import('@teachablemachine/image')
        }
        const tm = typeof mod.load === 'function' ? mod : mod.default!
        const base = modelBase()
        const m = await tm.load(`${base}model.json`, `${base}metadata.json`)
        model.value = m
        labels.value = m.getClassLabels()
      } finally {
        loading.value = false
      }
    })()
    try {
      await loadPromise
    } catch (e) {
      loadPromise = null
      throw e
    }
  }

  /** Center-crop the video to a square, scale to 224×224 and predict. */
  async function predictVideo(video: HTMLVideoElement): Promise<Frame | null> {
    if (!model.value || video.readyState < 2 || !video.videoWidth) return null
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.width = canvas.height = SIZE
      ctx = canvas.getContext('2d', { willReadFrequently: true })
    }
    if (!ctx) return null
    const w = video.videoWidth
    const h = video.videoHeight
    const s = Math.min(w, h)
    ctx.drawImage(video, (w - s) / 2, (h - s) / 2, s, s, 0, 0, SIZE, SIZE)

    // Cheap brightness estimate (every 8th pixel) to warn about darkness.
    const data = ctx.getImageData(0, 0, SIZE, SIZE).data
    let sum = 0
    let n = 0
    for (let i = 0; i < data.length; i += 32) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      n++
    }

    const predictions = await model.value.predict(canvas)
    return {
      predictions: predictions.map((p) => ({ className: p.className, probability: p.probability })),
      luminance: sum / n,
    }
  }

  return { model, labels, loading, load, predictVideo }
}
