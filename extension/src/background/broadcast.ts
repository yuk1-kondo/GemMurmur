import type { MurmurMessage } from '@/shared/messages'
import { pageKeyFromUrl } from '@/shared/page-key'

async function sendToTab(tabId: number, message: MurmurMessage): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message)
  } catch {
    // Tab may not have content script
  }
}

/** Fan-out to every tab (settings, model status, etc.). */
export async function broadcastAll(message: MurmurMessage): Promise<void> {
  const tabs = await chrome.tabs.query({})
  await Promise.all(tabs.map((tab) => (tab.id != null ? sendToTab(tab.id, message) : undefined)))
}

/** Send page-scoped messages only to tabs on the same pageKey. */
export async function broadcastToPage(pageKey: string, message: MurmurMessage): Promise<void> {
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] })
  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id == null || !tab.url) return
      if (pageKeyFromUrl(tab.url) !== pageKey) return
      await sendToTab(tab.id, message)
    }),
  )
}
