import { FONT_STACK, OVERLAY_ROOT_ID, OVERLAY_Z_INDEX } from '@/shared/constants'

export function ensureOverlayRoot(): HTMLElement {
  const existing = document.getElementById(OVERLAY_ROOT_ID)
  if (existing) return existing

  const root = document.createElement('div')
  root.id = OVERLAY_ROOT_ID
  root.setAttribute('data-murmur', 'root')
  Object.assign(root.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: String(OVERLAY_Z_INDEX),
    fontFamily: FONT_STACK,
  })

  const style = document.createElement('style')
  style.textContent = `
    #${OVERLAY_ROOT_ID} .murmur-comment {
      position: absolute;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 95vw;
      font-weight: 700;
      line-height: 1.2;
      will-change: transform, opacity;
      user-select: none;
      pointer-events: none;
    }
    #${OVERLAY_ROOT_ID} .murmur-comment-center {
      z-index: 3;
      text-align: center;
      max-width: 90vw;
    }
    #${OVERLAY_ROOT_ID} .murmur-status {
      position: absolute;
      max-width: min(90vw, 640px);
      font-weight: 800;
      white-space: pre-wrap;
      pointer-events: none;
    }
    #${OVERLAY_ROOT_ID} .murmur-status.center {
      left: 50%;
      top: 40%;
      transform: translate(-50%, -50%);
      text-align: center;
    }
    #${OVERLAY_ROOT_ID} .murmur-status.corner {
      left: auto;
      right: 20px;
      top: auto;
      bottom: 16%;
      transform: none;
      text-align: right;
      opacity: 0.82;
    }
    #${OVERLAY_ROOT_ID} .murmur-status.error {
      color: #ff2d2d;
      font-size: 42px;
      text-shadow:
        -2px -2px 0 #1a0000,
         2px -2px 0 #1a0000,
        -2px  2px 0 #1a0000,
         2px  2px 0 #1a0000,
         0 0 12px rgba(0,0,0,0.55);
    }
    #${OVERLAY_ROOT_ID} .murmur-status.info {
      color: #fff;
      font-size: 15px;
      text-shadow:
        -1px -1px 0 #111,
         1px -1px 0 #111,
        -1px  1px 0 #111,
         1px  1px 0 #111;
    }
    #${OVERLAY_ROOT_ID} .murmur-controls {
      position: absolute;
      right: 16px;
      bottom: 16px;
      display: flex;
      gap: 8px;
      pointer-events: auto;
      z-index: 2;
    }
    #${OVERLAY_ROOT_ID} .murmur-controls button {
      border: none;
      border-radius: 999px;
      padding: 8px 12px;
      font: 600 12px/1 ${FONT_STACK};
      background: rgba(20,20,20,0.72);
      color: #fff;
      cursor: pointer;
      backdrop-filter: blur(6px);
      transition: background 120ms ease, transform 120ms ease;
    }
    #${OVERLAY_ROOT_ID} .murmur-controls button:hover {
      background: rgba(40,40,40,0.88);
      transform: translateY(-1px);
    }
    #${OVERLAY_ROOT_ID} .murmur-controls button:active {
      transform: translateY(0);
    }
  `
  root.appendChild(style)
  document.documentElement.appendChild(root)
  return root
}

export function removeOverlayRoot(): void {
  document.getElementById(OVERLAY_ROOT_ID)?.remove()
}
