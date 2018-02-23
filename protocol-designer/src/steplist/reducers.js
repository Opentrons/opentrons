// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { ActionType } from 'redux-actions'
import { createSelector } from 'reselect'
import flatMap from 'lodash/flatMap'
import max from 'lodash/max'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import range from 'lodash/range'

import {INITIAL_DECK_SETUP_ID} from './constants'
import type {BaseState} from '../types'
import type {
  Command,
  FormData,
  StepItemData,
  StepIdType,
  StepSubItemData,
  PauseFormData,
  FormSectionState,
  FormModalFields
} from './types'

import {
  type ValidFormAndErrors,
  generateNewForm,
  validateAndProcessForm,
  generateCommands,
  formHasErrors
} from './generateSubsteps' // TODO rename generateSubsteps.js to something else

import type {
  AddStepAction,
  DeleteStepAction,
  SaveStepFormAction,
  SelectStepAction,

  PopulateFormAction,
  CollapseFormSectionAction, // <- TODO this isn't a thunk

  ChangeMoreOptionsModalInputAction,
  OpenMoreOptionsModal,
  SaveMoreOptionsModal
} from './actions' // Thunk action creators

import {
  cancelStepForm, // TODO try collapsing them all into a single Action type
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
  SAVE_STEP_FORM: (state, action: ActionType<typeof saveStepForm>) => null,
  DELETE_STEP: () => null,
  // save the modal state into the unsavedForm --
  // it was 2 levels away from savedStepForms, now it's one level away
  SAVE_MORE_OPTIONS_MODAL: (state, action: SaveMoreOptionsModal) => ({...state, ...action.payload})
}, null)

// Handles aspirate / dispense form sections opening / closing
export const initialFormSectionState: FormSectionState = {aspirate: true, dispense: true}

const formSectionCollapse = handleActions({
  COLLAPSE_FORM_SECTION: (state, action: CollapseFormSectionAction) =>
    ({...state, [action.payload]: !state[action.payload]}),
  // exiting the form resets the collapse state
  CANCEL_STEP_FORM: () => initialFormSectionState,
  SAVE_STEP_FORM: () => initialFormSectionState,
  POPULATE_FORM: () => initialFormSectionState
}, initialFormSectionState)

// Add default title (and later, other default values) to newly-created Step
// TODO: Ian 2018-01-26 don't add any default values, selector should generate title if missing,
// title is all pristine Steps need added into the selector.
function createDefaultStep (action: AddStepAction) {
  const {stepType} = action.payload
  return {...action.payload, title: stepType}
}

// the form modal (MORE OPTIONS) is an unsaved version of unsavedForm.
// It's 2 degrees away from actual savedStepForms.
const unsavedFormModal = handleActions({
  OPEN_MORE_OPTIONS_MODAL: (state, action: OpenMoreOptionsModal) => action.payload,
  CHANGE_MORE_OPTIONS_MODAL_INPUT: (state, action: ChangeMoreOptionsModalInputAction) =>
    ({...state, [action.payload.accessor]: action.payload.value}),
  CANCEL_MORE_OPTIONS_MODAL: () => null,
  SAVE_MORE_OPTIONS_MODAL: () => null,
  DELETE_STEP: () => null
}, null)

type StepsState = {[StepIdType]: StepItemData}

const initialStepState = {
  [INITIAL_DECK_SETUP_ID]: {
    id: INITIAL_DECK_SETUP_ID,
    title: 'Deck Setup',
    stepType: 'deck-setup'
  }
}

const steps = handleActions({
  ADD_STEP: (state, action: AddStepAction) => ({
    ...state,
    [action.payload.id]: createDefaultStep(action)
  }),
  DELETE_STEP: (state, action: DeleteStepAction) => omit(state, action.payload.toString())
}, initialStepState)

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
  DELETE_STEP: (state: CollapsedStepsState, action: DeleteStepAction) =>
    omit(state, action.payload.toString()),
  TOGGLE_STEP_COLLAPSED: (state: CollapsedStepsState, {payload}: ActionType<typeof toggleStepCollapsed>) => ({
    ...state,
    [payload]: !state[payload]
  })
}, {})

type OrderedStepsState = Array<StepIdType>

const orderedSteps = handleActions({
  ADD_STEP: (state: OrderedStepsState, action: AddStepAction) =>
    [...state, action.payload.id],
  DELETE_STEP: (state: OrderedStepsState, action: DeleteStepAction) =>
    state.filter(stepId => stepId !== action.payload)
}, [INITIAL_DECK_SETUP_ID])

type SelectedStepState = null | StepIdType

const selectedStep = handleActions({
  SELECT_STEP: (state: SelectedStepState, action: SelectStepAction) => action.payload,
  DELETE_STEP: () => null
}, INITIAL_DECK_SETUP_ID)

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
  unsavedFormModal: FormModalFields,
  formSectionCollapse: FormSectionState,
  steps: StepsState,
  savedStepForms: SavedStepFormState,
  collapsedSteps: CollapsedStepsState,
  orderedSteps: OrderedStepsState,
  selectedStep: SelectedStepState,
  stepCreationButtonExpanded: StepCreationButtonExpandedState
|}

export const _allReducers = {
  unsavedForm,
  unsavedFormModal,
  formSectionCollapse,
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

// TODO Ian 2018-02-08 rename formData to something like getUnsavedForm or unsavedFormFields
const formData = createSelector(
  rootSelector,
  (state: RootState) => state.unsavedForm
)

const formModalData = createSelector(
  rootSelector,
  (state: RootState) => state.unsavedFormModal
)

const selectedStepId = createSelector(
  rootSelector,
  (state: RootState) => state.selectedStep
)

const allSubsteps = (state: BaseState): {[StepIdType]: StepSubItemData | null} => {
  const validForms = validatedForms(state)
  console.log('allSubsteps', {validForms})
  return mapValues(validForms, (valForm: ValidFormAndErrors, stepId: StepIdType) => {
    // Don't try to render with errors. TODO LATER: presentational error state of substeps?
    if (valForm.validatedForm === null || formHasErrors(valForm)) {
      return null
    }

    if (valForm.validatedForm.stepType === 'deck-setup') {
      // No substeps for Deck Setup
      return null
    }

    if (valForm.validatedForm.stepType === 'transfer') {
      const {
        sourceWells,
        destWells
        // sourceLabware, // TODO: show labware & volume, see new designs
        // destLabware,
        // volume
      } = valForm.validatedForm

      return {
        stepType: 'transfer',
        parentStepId: stepId,
        rows: range(sourceWells.length).map(i => ({
          substepId: i,
          sourceIngredientName: 'ING1', // TODO get ingredients for source/dest wells
          destIngredientName: 'ING2',
          sourceWell: sourceWells[i],
          destWell: destWells[i]
        }))
      }
    }

    if (valForm.validatedForm.stepType === 'pause') {
      // just returns formData
      const formData: PauseFormData = valForm.validatedForm
      return formData
    }

    console.warn('allSubsteps doesnt support step type: ' + valForm.validatedForm.stepType)
    return null
  })
}

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

const selectedStepSelector = createSelector(
  allSteps,
  selectedStepId,
  (allSteps, selectedStepId) => allSteps && selectedStepId !== null && allSteps[selectedStepId]
)

// TODO SOON Ian 2018-02-14 rename validatedForms -> validatedSteps, since not all steps have forms
const validatedForms = (state: BaseState): {[StepIdType]: ValidFormAndErrors} => {
  // TODO LATER Ian 2018-02-14 this should use selectors instead of accessing rootSelector result directly
  const s = rootSelector(state)
  if (s.orderedSteps.length === 0) {
    // No steps -- since initial Deck Setup step exists in default Redux state,
    // this probably should never happen
    console.warn('validatedForms called with no steps in "orderedSteps"')
    return {}
  }

  return s.orderedSteps.reduce((acc, stepId) => {
    if (s.steps[stepId].stepType === 'deck-setup') {
      // const nextStepData = s.savedDeckSetups[stepId] // TODO: need savedDeckSetups in state
      const nextStepData = { // TODO don't hard-code
        errors: {},
        validatedForm: {
          stepType: 'deck-setup',
          labware: {
            sourcePlateId: { // TODO match real type of DeckSetupData
              slot: '2',
              type: '96-flat'
            }
          },
          instruments: {
            p300SingleId: {
              mount: 'right',
              model: 300
            }
          }
        }
      }
      return {
        ...acc,
        [stepId]: nextStepData
      }
    } else {
      const nextStepData = (s.savedStepForms[stepId] && s.steps[stepId])
        ? validateAndProcessForm(s.savedStepForms[stepId])
        : {
          errors: {'form': ['no saved form for step ' + stepId]},
          validatedForm: null
        } // TODO revisit

      return {
        ...acc,
        [stepId]: nextStepData
      }
    }
  }, {})
}

const commands = (state: BaseState): Array<Command> | 'ERROR COULD NOT GENERATE COMMANDS (TODO)' => {
  // TODO use existing selectors, don't rewrite!!!
  const forms = validatedForms(state)
  const orderedSteps = rootSelector(state).orderedSteps

  // don't try to make commands if the step forms are null or if there are any errors.
  if (orderedSteps.some(stepId => forms[stepId].validatedForm === null)) {
    return 'ERROR COULD NOT GENERATE COMMANDS (TODO)'
  }

  return orderedSteps && flatMap(orderedSteps, (stepId): Array<Command> => {
    const formDataAndErrors = forms[stepId]
    if (formDataAndErrors.validatedForm === null) {
      throw new Error('validatedForm should not be null here') // for flow only, should be fully handled above
    }
    // TODO checking if there are some errors is repeated from substeps selector, DRY it up
    return generateCommands(formDataAndErrors.validatedForm)
  })
}

const deckSetupMode = createSelector(
  (state: BaseState) => rootSelector(state).steps,
  (state: BaseState) => rootSelector(state).selectedStep,
  (steps, selectedStep) => (selectedStep !== null && steps[selectedStep])
    ? steps[selectedStep].stepType === 'deck-setup'
    : false
)

export const selectors = {
  rootSelector,
  stepCreationButtonExpanded: createSelector(
    rootSelector,
    (state: RootState) => state.stepCreationButtonExpanded
  ),
  allSteps,
  selectedStep: selectedStepSelector,
  selectedStepId, // TODO replace with selectedStep: selectedStepSelector
  selectedStepFormData: createSelector(
    (state: BaseState) => rootSelector(state).savedStepForms,
    (state: BaseState) => rootSelector(state).selectedStep,
    (state: BaseState) => rootSelector(state).steps,
    (savedStepForms, selectedStepId, steps) => {
      if (selectedStepId === null) {
        // no step selected
        return false
      }

      if (steps[selectedStepId].stepType === 'deck-setup') {
        // Deck Setup step has no form data
        return false
      }

      return (
        // existing form
        savedStepForms[selectedStepId] ||
        // new blank form
        generateNewForm(selectedStepId, steps[selectedStepId].stepType)
      )
    }
  ),
  formData,
  formModalData,
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
        ? !formHasErrors(
          validateAndProcessForm(formData)
        )
        : null
  ),
  formSectionCollapse: createSelector(
    rootSelector,
    s => s.formSectionCollapse
  ),
  deckSetupMode
}

export default rootReducer
