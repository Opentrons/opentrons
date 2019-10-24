// @flow
import { RESTART_PENDING_STATUS, RESTARTING_STATUS } from './constants'

import type { State } from '../types'

const robotState = (state: State, name: string) => state.robotAdmin[name]

export function getRobotRestarting(state: State, robotName: string): boolean {
  const status = robotState(state, robotName)?.status
  return status === RESTART_PENDING_STATUS || status === RESTARTING_STATUS
}
