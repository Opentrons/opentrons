import type { State } from '../types'
import type { PerRobotRobotSettingsState, RobotSettings } from './types'

const robotState = (
  state: State,
  name: string | null
): PerRobotRobotSettingsState | null =>
  name != null ? (state.robotSettings[name] ?? null) : null

export function getRobotSettings(
  state: State,
  robotName: string | null
): RobotSettings {
  return robotState(state, robotName)?.settings || []
}
