// @flow
import * as stepFormSelectors from '../selectors'
import type { Dispatch } from 'redux'
import type { StepIdType } from '../../form-types'
import type { GetState } from '../../types'

export * from './modules'
export * from './pipettes'

export type SaveStepFormAction = {
  type: 'SAVE_STEP_FORM',
  payload: { id: StepIdType },
}

export const saveStepForm = () => (
  dispatch: Dispatch<*>,
  getState: GetState
) => {
  const state = getState()

  if (stepFormSelectors.getCurrentFormCanBeSaved(state)) {
    dispatch({
      type: 'SAVE_STEP_FORM',
      payload: stepFormSelectors.getUnsavedForm(state),
    })
  }
}
