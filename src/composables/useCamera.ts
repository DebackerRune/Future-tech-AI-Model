import { ref, shallowRef } from 'vue'

export type CameraError = 'denied' | 'missing' | 'insecure' | 'other'

interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean
}

/** Rear camera with optional torch. Frames are only ever drawn to an in-memory canvas. */
export function useCamera() {
  const active = ref(false)
  const torchAvailable = ref(false)
  const torchOn = ref(false)
  const stream = shallowRef<MediaStream | null>(null)

  async function start(video: HTMLVideoElement): Promise<CameraError | null> {
    if (active.value) return null
    if (!window.isSecureContext) return 'insecure'
    if (!navigator.mediaDevices?.getUserMedia) return 'missing'
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      stream.value = s
      video.srcObject = s
      video.muted = true
      video.setAttribute('playsinline', '')
      await video.play()
      const track = s.getVideoTracks()[0]
      const caps = (track.getCapabilities?.() ?? {}) as TorchCapabilities
      torchAvailable.value = Boolean(caps.torch)
      active.value = true
      return null
    } catch (e) {
      const name = (e as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
      if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'missing'
      return 'other'
    }
  }

  function stop(video?: HTMLVideoElement | null) {
    stream.value?.getTracks().forEach((t) => t.stop())
    stream.value = null
    if (video) video.srcObject = null
    active.value = false
    torchAvailable.value = false
    torchOn.value = false
  }

  async function setTorch(on: boolean): Promise<boolean> {
    const track = stream.value?.getVideoTracks()[0]
    if (!track || !torchAvailable.value) return false
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] })
      torchOn.value = on
      return true
    } catch {
      return false
    }
  }

  return { active, torchAvailable, torchOn, start, stop, setTorch }
}
