// @flow
import { uuid } from '../../../../utils'
import { selectStep } from '../actions'

import type { StepType } from '../../../../form-types'
import type { GetState, ThunkDispatch } from '../../../../types'

type AddStepPayload = { id: string, stepType: StepType }
type AddStepAction = {| type: 'ADD_STEP', payload: AddStepPayload |}
const _addStep = (payload: AddStepPayload): AddStepAction => ({
  type: 'ADD_STEP',
  payload,
})

// addStep thunk adds an incremental integer ID for Step reducers.
// NOTE: if this is an "add step" directly performed by the user,
// addAndSelectStepWithHints is probably what you want
export const addStep = (payload: { stepType: StepType }) => (
  dispatch: ThunkDispatch<*>,
  getState: GetState
) => {
  const stepId = uuid()
  const { stepType } = payload
  dispatch(
    _addStep({
      ...payload,
      id: stepId,
    })
  )
  dispatch(selectStep(stepId, stepType))
}
