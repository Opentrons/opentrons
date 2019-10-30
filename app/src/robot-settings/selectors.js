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

export function getRobotRestartPath(
  state: State,
  robotName: string
): string | null {
  return robotState(state, robotName)?.restartPath || null
}

export function getRobotRestartRequired(
  state: State,
  robotName: string
): boolean {
  return getRobotRestartPath(state, robotName) !== null
}

export function getAllRestartRequiredRobots(state: State): Array<string> {
  return Object.keys(state.robotSettings).filter(name => {
    return getRobotRestartRequired(state, name)
  })
}
