// @flow
import type { State } from '../types'
import * as Types from './types'

export const getRobotSessions: (
  state: State,
  robotName: string
) => Types.SessionsById | null = (state, robotName) =>
  state.sessions[robotName]?.robotSessions ?? null

export const getRobotSessionById: (
  state: State,
  robotName: string,
  sessionId: string
) => Types.SessionData | null = (state, robotName, sessionId) => {
  return (getRobotSessions(state, robotName) || {})[sessionId] ?? null
}
