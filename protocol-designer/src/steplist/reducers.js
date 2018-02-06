// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { ActionType } from 'redux-actions'
import { createSelector } from 'reselect'
import isNil from 'lodash/isNil'
import flatMap from 'lodash/flatMap'
import max from 'lodash/max'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'

import type {BaseState} from '../types'
import type {Command, FormData, StepItemData, StepIdType, StepSubItemData} from './types'
import {type ValidFormAndErrors, generateNewForm, validateAndProcessForm, generateCommands} from './generateSubsteps'

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

type FormState = FormData | null

// the `form` state holds temporary form info that is saved or thrown away with "cancel".
// TODO: rename to make that more clear. 'unsavedForm'?
const unsavedForm = handleActions({
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
  [StepIdType]: FormData
}

const savedStepForms = handleActions({
  SAVE_STEP_FORM: (state, action: SaveStepFormAction) => ({
    ...state,
    [action.payload.id]: action.payload
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
  unsavedForm: FormState,
  steps: StepsState,
  savedStepForms: SavedStepFormState,
  collapsedSteps: CollapsedStepsState,
  orderedSteps: OrderedStepsState,
  selectedStep: SelectedStepState,
  stepCreationButtonExpanded: StepCreationButtonExpandedState
|}

export const _allReducers = {
  unsavedForm,
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

// ======= Selectors ===============================================

const formData = createSelector(
  rootSelector,
  (state: RootState) => state.unsavedForm
)

const selectedStepId = createSelector(
  rootSelector,
  (state: RootState) => state.selectedStep
)

const allSubsteps = (state: BaseState): {[StepIdType]: Array<StepSubItemData>} =>
  mapValues(validatedForms(state), (valForm, stepId) => {
    if (!valForm.validatedForm) {
      return []
    }

    if (valForm.stepType === 'transfer') {
      const {
        sourceWells,
        destWells
        // sourceLabware, // TODO: show labware & volume, see new designs
        // destLabware,
        // volume
      } = valForm.validatedForm

      // Don't try to render with errors. TODO LATER: presentational error state of substeps?
      if (checkForErrorsHack(valForm)) {
        return []
      }

      return range(sourceWells.length).map(i => ({
        parentStepId: stepId,
        substepId: i,
        sourceIngredientName: 'ING1',
        destIngredientName: 'ING2',
        sourceWell: sourceWells[i],
        destWell: destWells[i]
      }))
    }
    console.warn('allSubsteps doesnt support step type: ' + valForm.stepType)
    return []
  })

const allSteps = createSelector(
  (state: BaseState) => rootSelector(state).steps,
  (state: BaseState) => rootSelector(state).orderedSteps,
  (state: BaseState) => rootSelector(state).collapsedSteps,
  allSubsteps,
  (steps, orderedSteps, collapsedSteps, _allSubsteps) => orderedSteps.map(id => ({
    ...steps[id],
    collapsed: collapsedSteps[id],
    substeps: _allSubsteps[id]
  }))
)

 // TODO HACK
const checkForErrorsHack = (validForm: ValidFormAndErrors | null): boolean =>
  (validForm && validForm.errors)
    ? Object.values(validForm.errors).some(err => Array.isArray(err) && err.length > 0)
    : true // No forms counts as error

const validatedForms = (state: BaseState): {[StepIdType]: ValidFormAndErrors} | null => {
  const s = rootSelector(state)
  if (s.orderedSteps.length === 0) {
    return null
  }

  return s.orderedSteps.reduce((acc, stepId) => ({
    ...acc,
    [stepId]: (s.savedStepForms[stepId] && s.steps[stepId])
      ? validateAndProcessForm(s.savedStepForms[stepId])
      : {errors: {'form': ['no saved form for step ' + stepId]}, validatedForm: {}} // TODO revisit
  }), {})
}

const commands = (state: BaseState): Array<Command> | 'ERROR COULD NOT GENERATE COMMANDS (TODO)' => {
  // TODO use existing selectors, don't rewrite!!!
  const forms = validatedForms(state)
  const orderedSteps = rootSelector(state).orderedSteps

  // don't try to make commands if the step forms are null or if there are any errors.
  if (forms === null || orderedSteps.map(stepId => checkForErrorsHack(forms[stepId])).some(err => err)) {
    return 'ERROR COULD NOT GENERATE COMMANDS (TODO)'
  }

  return orderedSteps && flatMap(orderedSteps, (stepId): Array<Command> => {
    const formDataAndErrors = forms[stepId]
    // TODO checking if there are some errors is repeated from substeps selector, DRY it up
    return generateCommands(formDataAndErrors.validatedForm)
  })
}

export const selectors = {
  stepCreationButtonExpanded: createSelector(
    rootSelector,
    (state: RootState) => state.stepCreationButtonExpanded
  ),
  allSteps,
  selectedStepId,
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
  formData,
  nextStepId: createSelector( // generates the next step ID to use
    (state: BaseState) => rootSelector(state).steps,
    (steps): number => {
      const allStepIds = Object.keys(steps).map(stepId => parseInt(stepId))
      return allStepIds.length === 0
        ? 0
        : max(allStepIds) + 1
    }
  ),
  allSubsteps,
  validatedForms,
  commands,
  currentFormErrors: (state: BaseState) => {
    const form = formData(state)
    return form && validateAndProcessForm(form).errors // TODO refactor selectors
  },
  currentFormCanBeSaved: createSelector(
    formData,
    selectedStepId,
    allSteps,
    (formData, selectedStepId, allSteps): boolean | null =>
      ((selectedStepId !== null) && allSteps[selectedStepId] && formData)
        ? !checkForErrorsHack(
          validateAndProcessForm(formData)
        )
        : null
  )
}

export default rootReducer
