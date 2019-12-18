// @flow
import type { State } from '../types'

export const getLightsOn = (
  state: State,
  robotName: string
): boolean | null => {
  const lightsOn = state.robotControls[robotName]?.lightsOn
  return lightsOn != null ? lightsOn : null
}
