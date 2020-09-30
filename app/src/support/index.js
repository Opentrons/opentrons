// @flow
// user support module
import { createLogger } from '../logger'
import { initializeProfile } from './profile'

import type { SupportConfig } from './types'

const log = createLogger(__filename)

export function initializeSupport(config: SupportConfig): void {
  log.debug('Support config', { config })
  initializeProfile(config)
}
