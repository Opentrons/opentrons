import type { State } from '../../types'

export function getIsRobotServerActive(state: State): boolean {
  return state.shell.robotSystem.robotServerStatus === 'active'
}
