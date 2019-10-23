// @flow
import type { State } from '../types'
import type { RobotSettings } from './types'

const robotState = (state: State, name: string) => state.robotSettings[name]

export function getRobotSettings(
  state: State,
  robotName: string
): RobotSettings {
  return robotState(state, robotName)?.settings || []
}

export function getRobotRestartRequired(
  state: State,
  robotName: string
): boolean {
  return robotState(state, robotName)?.restartRequired || false
}
