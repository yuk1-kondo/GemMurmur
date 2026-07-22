import type { ResolvedLanguage } from '@/shared/types'
import { text } from '@/shared/ui-i18n'

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
  controls.setAttribute('aria-label', 'GemMurmur controls')

  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = paused ? text(language, 'resume') : text(language, 'pause')
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
