import type { State } from '../types'
import type { MovementStatus } from './types'

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
