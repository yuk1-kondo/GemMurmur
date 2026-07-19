import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

const icons = {
  16: 'icons/icon-16.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
}

export default defineManifest({
  manifest_version: 3,
  name: 'Murmur',
  version: pkg.version,
  description: 'Every page has an audience. Local Gemma-powered live comments.',
  icons,
  action: {
    default_title: 'Murmur',
    default_popup: 'popup.html',
    default_icon: icons,
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  // WASM instantiation for LiteRT-LM requires 'wasm-unsafe-eval'. Scripts stay
  // local ('self') because MV3 forbids remote code execution.
  // Note: MV3 rejects extra values (e.g. blob:) in script-src/worker-src, so
  // keep this to the minimal set Chrome accepts.
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
  },
  permissions: ['storage', 'offscreen', 'tabs', 'alarms'],
  host_permissions: [
    'https://huggingface.co/*',
    'https://*.huggingface.co/*',
    'https://*.hf.co/*',
  ],
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/main.ts'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['offscreen.html', 'wasm/*'],
      matches: ['<all_urls>'],
    },
  ],
})
