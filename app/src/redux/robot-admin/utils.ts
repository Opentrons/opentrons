import { startDiscovery } from '../discovery'
import { restartStatusChanged } from './actions'
import {
  RESTART_DISCOVERY_TIMEOUT_MS,
  RESTART_PENDING_STATUS,
} from './constants'

import type { Action } from '../types'

/**
 * Mark a robot as restart-pending and kick discovery so we can observe
 * connectivity / bootId changes until the restart completes.
 */
export function beginRobotRestartTracking(
  robotName: string,
  bootId: string | null
): Action[] {
  return [
    restartStatusChanged(robotName, RESTART_PENDING_STATUS, bootId, new Date()),
    startDiscovery(RESTART_DISCOVERY_TIMEOUT_MS),
  ]
}
