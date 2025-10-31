import type { State } from '../../types'
import type { CameraState } from '../types'

export const getCameraUsageState: (
  state: State,
  runId: string
) => CameraState | null = (state, runId) =>
  state.protocolRuns[runId]?.camera ?? null
