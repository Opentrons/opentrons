// robot selectors
import type { State } from '../types'

import type { ConnectionState } from './reducer/connection'

const connection = (state: State): ConnectionState => state.robot.connection

export function getConnectedRobotName(state: State): string | null {
  return connection(state).connectedTo
}
