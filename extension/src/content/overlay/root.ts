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
  // Dynamic viewport units keep the overlay aligned when mobile browser chrome moves.
  root.style.height = '100dvh'

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
    #${OVERLAY_ROOT_ID} .murmur-comment-rtl {
      text-align: right;
      unicode-bidi: plaintext;
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
    #${OVERLAY_ROOT_ID} .murmur-status[dir="rtl"] {
      text-align: right;
      unicode-bidi: plaintext;
    }
    #${OVERLAY_ROOT_ID} .murmur-status.error {
      color: #c43c3c;
      font-size: 42px;
      text-shadow:
        -1px -1px 0 #fff,
         1px -1px 0 #fff,
        -1px  1px 0 #fff,
         1px  1px 0 #fff,
         0 1px 2px rgb(0 0 0 / 25%);
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
      min-height: 40px;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 8px 12px;
      font: 600 12px/1 ${FONT_STACK};
      background: rgb(255 255 255 / 94%);
      color: #0d0d0d;
      cursor: pointer;
      box-shadow: 0 1px 2px rgb(0 0 0 / 4%);
      transition: background 120ms ease, border-color 120ms ease;
    }
    @media (hover: hover) {
      #${OVERLAY_ROOT_ID} .murmur-controls button:hover {
        border-color: #d0d0d0;
        background: #efefef;
      }
    }
    #${OVERLAY_ROOT_ID} .murmur-controls button:focus-visible {
      outline: 3px solid rgb(16 163 127 / 40%);
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      #${OVERLAY_ROOT_ID} .murmur-comment,
      #${OVERLAY_ROOT_ID} .murmur-controls button {
        transition-duration: 0.01ms !important;
      }
    }
  `
  root.appendChild(style)
  document.documentElement.appendChild(root)
  return root
}

export function removeOverlayRoot(): void {
  document.getElementById(OVERLAY_ROOT_ID)?.remove()
}
