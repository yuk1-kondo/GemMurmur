import type { ResolvedLanguage } from '@/shared/types'

const LABELS: Record<ResolvedLanguage, { pause: string; resume: string }> = {
  ja: { pause: '一時停止', resume: '再開' },
  en: { pause: 'Pause', resume: 'Resume' },
  'zh-Hans': { pause: '暂停', resume: '继续' },
  'zh-Hant': { pause: '暫停', resume: '繼續' },
}

/**
 * Render a single pause/resume toggle button. It stays visible while paused so
 * the user can resume; the label reflects the current paused state.
 */
export function mountOverlayControls(
  root: HTMLElement,
  language: ResolvedLanguage,
  paused: boolean,
  onToggle: () => void,
): () => void {
  root.querySelector('.murmur-controls')?.remove()

  const controls = document.createElement('div')
  controls.className = 'murmur-controls'
  controls.setAttribute('aria-label', 'Murmur controls')

  const labels = LABELS[language]
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = paused ? labels.resume : labels.pause
  button.dataset.action = paused ? 'resume' : 'pause'
  if (paused) button.classList.add('is-paused')
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    onToggle()
  })
  controls.appendChild(button)

  root.appendChild(controls)
  return () => controls.remove()
}
