// @flow
import { uuid } from '../../../../utils'

import type { StepType } from '../../../../form-types'

type AddStepPayload = { id: string, stepType: StepType }
type AddStepAction = {| type: 'ADD_STEP', payload: AddStepPayload |}

// TODO IMMEDIATELY consider moving into actions js

// adds an incremental integer ID for Step reducers.
// NOTE: if this is an "add step" directly performed by the user,
// addAndSelectStepWithHints is probably what you want
export const addStep = (payload: { stepType: StepType }): AddStepAction => {
  const stepId = uuid()
  return {
    type: 'ADD_STEP',
    payload: {
      stepType: payload.stepType,
      id: stepId,
    },
  }
}
