// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { ActionType } from 'redux-actions'
import { createSelector } from 'reselect'
import isNil from 'lodash/isNil'
import max from 'lodash/max'

import type {BaseState} from '../types'
import type {FormData, StepItemData, StepIdType, StepType} from './types'
import {validateAndProcessForm} from './generateSubsteps'

import type {
  AddStepAction,
  PopulateFormAction,
  SaveStepFormAction,
  SelectStepAction
} from './actions' // Thunk action creators
import {
  cancelStepForm,
  saveStepForm,
  changeFormInput,
  expandAddStepButton,
  toggleStepCollapsed
} from './actions'

const generateNewForm = (stepId: StepIdType, stepType: StepType): FormData => {
  if (stepType === 'transfer') {
  // TODO: other actions
    return {
      id: stepId
      // TODO: rest of blank fields? Default values?
    }
  }
  console.error('Only transfer forms are supported now. TODO.')
}

type FormState = FormData | null

// the `form` state holds temporary form info that is saved or thrown away with "cancel"
const form = handleActions({
  CHANGE_FORM_INPUT: (state, action: ActionType<typeof changeFormInput>) => ({
    ...state,
    [action.payload.accessor]: action.payload.value
  }),
  POPULATE_FORM: (state, action: PopulateFormAction) => action.payload,
  CANCEL_STEP_FORM: (state, action: ActionType<typeof cancelStepForm>) => null,
  SAVE_STEP_FORM: (state, action: ActionType<typeof saveStepForm>) => null
}, null)

// Add default title (and later, other default values) to newly-created Step
// TODO: Ian 2018-01-26 don't add any default values, selector should generate title if missing,
// title is all pristine Steps need added into the selector.
function createDefaultStep (action: AddStepAction) {
  const {stepType} = action.payload
  return {...action.payload, title: stepType}
}

type StepsState = {[StepIdType]: StepItemData}

const steps = handleActions({
  ADD_STEP: (state, action: AddStepAction) => ({
    ...state,
    [action.payload.id]: createDefaultStep(action)
  })
}, {})

type SavedStepFormState = {
  [StepIdType]: {
    ...FormData,
    id: StepIdType
  }
}

const savedStepForms = handleActions({
  SAVE_STEP_FORM: (state, action: SaveStepFormAction) => ({
    ...state,
    [action.payload.id]: action.payload // TODO translate fields don't literally take them
  })
}, {})

type CollapsedStepsState = {
  [StepIdType]: boolean
}

const collapsedSteps = handleActions({
  ADD_STEP: (state: CollapsedStepsState, action: AddStepAction) => ({
    ...state,
    [action.payload.id]: false
  }),
  TOGGLE_STEP_COLLAPSED: (state: CollapsedStepsState, {payload}: ActionType<typeof toggleStepCollapsed>) => ({
    ...state,
    [payload]: !state[payload]
  })
}, {})

type OrderedStepsState = Array<StepIdType>

const orderedSteps = handleActions({
  ADD_STEP: (state: OrderedStepsState, action: AddStepAction) =>
    [...state, action.payload.id]
}, [])

type SelectedStepState = null | StepIdType

const selectedStep = handleActions({
  SELECT_STEP: (state: SelectedStepState, action: SelectStepAction) => action.payload
}, null)

type StepCreationButtonExpandedState = boolean

const stepCreationButtonExpanded = handleActions({
  ADD_STEP: () => false,
  EXPAND_ADD_STEP_BUTTON: (
    state: StepCreationButtonExpandedState,
    {payload}: ActionType<typeof expandAddStepButton>
  ) =>
    payload
}, false)

export type RootState = {|
  form: FormState,
  steps: StepsState,
  savedStepForms: SavedStepFormState,
  collapsedSteps: CollapsedStepsState,
  orderedSteps: OrderedStepsState,
  selectedStep: SelectedStepState,
  stepCreationButtonExpanded: StepCreationButtonExpandedState
|}

export const _allReducers = {
  form,
  steps,
  savedStepForms,
  collapsedSteps,
  orderedSteps,
  selectedStep,
  stepCreationButtonExpanded
}

const rootReducer = combineReducers(_allReducers)

// TODO Ian 2018-01-19 Rethink the hard-coded 'steplist' key in Redux root
const rootSelector = (state: BaseState): RootState => state.steplist

export const selectors = {
  stepCreationButtonExpanded: createSelector(
    rootSelector,
    (state: RootState) => state.stepCreationButtonExpanded
  ),
  allSteps: createSelector(
    (state: BaseState) => rootSelector(state).steps,
    (state: BaseState) => rootSelector(state).orderedSteps,
    (state: BaseState) => rootSelector(state).collapsedSteps,
    (steps, orderedSteps, collapsedSteps) => orderedSteps.map(id => ({
      ...steps[id],
      collapsed: collapsedSteps[id]
    }))
  ),
  selectedStepId: createSelector(
    rootSelector,
    (state: RootState) => state.selectedStep
  ),
  selectedStepFormData: createSelector(
    (state: BaseState) => rootSelector(state).savedStepForms,
    (state: BaseState) => rootSelector(state).selectedStep,
    (state: BaseState) => rootSelector(state).steps,
    (savedStepForms, selectedStepId, steps) =>
      // existing form
      (selectedStepId !== null && savedStepForms[selectedStepId]) ||
      // new blank form
      (!isNil(selectedStepId) && generateNewForm(selectedStepId, steps[selectedStepId].stepType))
  ),
  formDataToStep: createSelector(
    rootSelector,
    (state: RootState) => ({...state.form}) // TODO
  ),
  formData: createSelector(
    rootSelector,
    (state: RootState) => state.form
  ),
  nextStepId: createSelector( // generates the next step ID to use
    (state: BaseState) => rootSelector(state).steps,
    (steps): number => {
      const allStepIds = Object.keys(steps).map(stepId => parseInt(stepId))
      return allStepIds.length === 0
        ? 0
        : max(allStepIds) + 1
    }
  ),
  validatedFormsDebug: state => {
    // TODO
    const s = rootSelector(state)
    console.log(s.orderedSteps, s.steps)
    return s.orderedSteps.map(stepId => {
      return (s.savedStepForms[stepId] && s.steps[stepId].stepType === 'transfer')
        ? validateAndProcessForm(s.steps[stepId].stepType, s.savedStepForms[stepId])
        : 'TODO non-transfer'
    })
  }
}

export default rootReducer
