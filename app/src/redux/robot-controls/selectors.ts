// @flow
import type { State } from '../types'
import type { MovementStatus } from './types'

export const getLightsOn = (
  state: State,
  robotName: string
): boolean | null => {
  const lightsOn = state.robotControls[robotName]?.lightsOn
  return lightsOn != null ? lightsOn : null
}

export const getMovementStatus = (
  state: State,
  robotName: string
): MovementStatus | null => {
  return state.robotControls[robotName]?.movementStatus || null
}

export const getMovementError = (
  state: State,
  robotName: string
): string | null => {
  const errorMessage = state.robotControls[robotName]?.movementError
  return errorMessage != null ? errorMessage : null
}
