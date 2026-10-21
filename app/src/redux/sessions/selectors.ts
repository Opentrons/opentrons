import type { State } from '../types'
import type * as Types from './types'

export const getRobotSessions: (state: State, robotName: string) => null = (
  state,
  robotName
) => null

export const getRobotSessionById: (
  state: State,
  robotName: string,
  sessionId: string
) => null = (state, robotName, sessionId) => null

export function getRobotSessionOfType(
  state: State,
  robotName: string,
  sessionType: Types.SessionType
): null {
  return null
}
