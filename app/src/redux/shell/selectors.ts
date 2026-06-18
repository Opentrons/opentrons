import type { State } from '../types'
import type { StepDetailViewerClosedState } from './types'

export function getSystemLanguage(state: State): string | null {
  return state.shell.systemLanguage?.[0] ?? null
}

export function getStepDetailViewerClosed(
  state: State
): StepDetailViewerClosedState {
  return state.shell.stepDetailViewerClosed
}
