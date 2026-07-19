const OFFSCREEN_URL = 'offscreen.html'

async function hasOffscreenDocument(): Promise<boolean> {
  if (!chrome.runtime.getContexts) return false
  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
    })
    return (contexts?.length ?? 0) > 0
  } catch {
    return false
  }
}

export async function ensureOffscreenDocument(): Promise<void> {
  if (await hasOffscreenDocument()) return

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['WORKERS'],
    justification: 'Run local Gemma inference with WebGPU via LiteRT-LM',
  })
}
