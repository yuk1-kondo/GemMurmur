import { bootstrap } from './runtime/lifecycle'
import { isExtensionContextValid } from './runtime/extension-context'
import { installMessageListener } from './runtime/messaging'
import { installContentStorageSync } from './runtime/storage-sync'

installMessageListener()
installContentStorageSync()
void bootstrap().catch((error) => {
  if (isExtensionContextValid()) {
    console.error('Murmur content initialization failed:', error)
  }
})
