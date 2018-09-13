// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import omit from 'lodash/omit'
import type {
  DismissFormWarning,
  DismissTimelineWarning,
} from './actions'
import {getPDMetadata} from '../file-types'
import type {BaseState} from '../types'
import type {LoadFileAction} from '../load-file'
import type {CommandCreatorWarning} from '../step-generation'
import type {FormWarning} from '../steplist'
import type {DeleteStepAction} from '../steplist/actions'

export type DismissedWarningsAllSteps<WarningType> = {[stepId: number]: ?Array<WarningType>}
export type DismissedWarningState = {
  form: DismissedWarningsAllSteps<FormWarning>,
  timeline: DismissedWarningsAllSteps<CommandCreatorWarning>,
}
const dismissedWarnings = handleActions({
  DISMISS_FORM_WARNING: (
    state: DismissedWarningState,
    action: DismissFormWarning
  ): DismissedWarningState => {
    const {stepId, warning} = action.payload
    if (stepId == null) {
      console.warn('Tried to dismiss form warning with no stepId')
      return state
    }

    return {
      ...state,
      form: {
        ...state.form,
        [stepId]: [
          ...(state.form[stepId] || []),
          warning,
        ],
      },
    }
  },
  DISMISS_TIMELINE_WARNING: (
    state: DismissedWarningState,
    action: DismissTimelineWarning
  ): DismissedWarningState => {
    const {stepId, warning} = action.payload
    if (stepId == null) {
      console.warn('Tried to dismiss timeline warning with no stepId')
      return state
    }
    return {
      ...state,
      timeline: {
        ...state.timeline,
        [stepId]: [
          ...(state.timeline[stepId] || []),
          warning,
        ],
      },
    }
  },
  DELETE_STEP: (state: DismissedWarningState, action: DeleteStepAction): DismissedWarningState => {
    // remove key for deleted step
    const stepId = action.payload.toString(10)
    return {
      form: omit(state.form, stepId),
      timeline: omit(state.timeline, stepId),
    }
  },
  LOAD_FILE: (state: DismissedWarningState, action: LoadFileAction): DismissedWarningState =>
    getPDMetadata(action.payload).dismissedWarnings,
}, {form: {}, timeline: {}})

export const _allReducers = {
  dismissedWarnings,
}

export type RootState = {
  dismissedWarnings: DismissedWarningState,
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer

export const rootSelector = (state: BaseState) => state.dismiss
