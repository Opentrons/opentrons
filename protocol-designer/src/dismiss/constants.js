// @flow
import { PRESAVED_STEP_ID } from '../steplist/types'

export const getStepIdOrPseudoId = (stepId: ?string): string =>
  stepId || PRESAVED_STEP_ID
