// @flow
import { getUnsavedForm } from '../selectors'
import type { Dispatch } from 'redux'
import type { StepIdType } from '../../form-types'
import type { GetState } from '../../types'

export * from './modules'
export * from './pipettes'

export const SAVE_STEP_FORM: 'SAVE_STEP_FORM' = 'SAVE_STEP_FORM'

export type SaveStepFormAction = {|
  type: typeof SAVE_STEP_FORM,
  payload: { id: StepIdType },
|}

export const saveStepForm = () => (dispatch: Dispatch<*>, getState: GetState) =>
  dispatch({ type: SAVE_STEP_FORM, payload: getUnsavedForm(getState()) })
