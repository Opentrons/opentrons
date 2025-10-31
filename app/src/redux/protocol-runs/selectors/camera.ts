import { INITIAL_CAMERA_STATE } from '../reducer/camera'

import type { State } from '../../types'
import type { CameraState } from '../types'

export const getCameraUsageState: (
  state: State,
  runId: string
) => CameraState = (state, runId) =>
  state.protocolRuns[runId]?.camera ?? INITIAL_CAMERA_STATE
