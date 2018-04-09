// @flow
import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import type { ActionType } from 'redux-actions'
import { createSelector } from 'reselect'
import reduce from 'lodash/reduce'
import max from 'lodash/max'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'

import {INITIAL_DECK_SETUP_ID} from './constants'
import type {BaseState, Selector} from '../types'
import {END_STEP} from './types'
import type {
  FormData,
  BlankForm,
  StepItemData,
  StepIdType,
  StepSubItemData,
  FormSectionState,
  FormModalFields
} from './types'

import {
  type ValidFormAndErrors,
  generateNewForm,
  validateAndProcessForm,
  formHasErrors
} from './formProcessing'

import {
  generateSubsteps
} from './generateSubsteps'

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
  hoverOnStep,
  toggleStepCollapsed
} from './actions'

import type {LabwareData} from '../step-generation/types'

// External selectors
import {equippedPipettes} from '../file-data/selectors/pipettes'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'

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

type SelectedStepState = null | StepIdType | typeof END_STEP

const selectedStep = handleActions({
  SELECT_STEP: (state: SelectedStepState, action: SelectStepAction) => action.payload,
  DELETE_STEP: () => null
}, INITIAL_DECK_SETUP_ID)

type HoveredStepState = SelectedStepState

const hoveredStep = handleActions({
  HOVER_ON_STEP: (state: HoveredStepState, action: ActionType<typeof hoverOnStep>) => action.payload
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
  unsavedFormModal: FormModalFields,
  formSectionCollapse: FormSectionState,
  steps: StepsState,
  savedStepForms: SavedStepFormState,
  collapsedSteps: CollapsedStepsState,
  orderedSteps: OrderedStepsState,
  selectedStep: SelectedStepState,
  hoveredStep: HoveredStepState,
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
  hoveredStep,
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

const hoveredStepId = createSelector(
  rootSelector,
  (state: RootState) => state.hoveredStep
)

const hoveredOrSelectedStepId: Selector<StepIdType | typeof END_STEP | null> = createSelector(
  hoveredStepId,
  selectedStepId,
  (hoveredId, selectedId) => hoveredId !== null
    ? hoveredId
    : selectedId
)

const getSteps = createSelector(
  rootSelector,
  (state: RootState) => state.steps
)

const getCollapsedSteps = createSelector(
  rootSelector,
  (state: RootState) => state.collapsedSteps
)

const orderedStepsSelector = createSelector(
  rootSelector,
  (state: RootState) => state.orderedSteps
)

/** This is just a simple selector, but has some debugging logic. TODO Ian 2018-03-20: use assert here */
const getSavedForms = createSelector(
  getSteps,
  orderedStepsSelector,
  (state: BaseState) => rootSelector(state).savedStepForms,
  (_steps, _orderedSteps, _savedStepForms) => {
    if (_orderedSteps.length === 0) {
      // No steps -- since initial Deck Setup step exists in default Redux state,
      // this probably should never happen
      console.warn('validatedForms called with no steps in "orderedSteps"')
      return []
    }

    if (_steps[0].stepType !== 'deck-setup') {
      console.error('Error: expected deck-setup to be first step.', _orderedSteps)
    }

    if (_orderedSteps.slice(1).some(stepId => _steps[stepId].stepType === 'deck-setup')) {
      console.error('Encountered a deck-setup step which was not the first step in orderedSteps. This is not supported yet.')
    }

    return _savedStepForms
  }
)

// TODO Ian 2018-02-14 rename validatedForms -> validatedSteps, since not all steps have forms (eg deck setup steps)
const validatedForms: Selector<{[StepIdType]: ValidFormAndErrors}> = createSelector(
  getSteps,
  getSavedForms,
  orderedStepsSelector,
  (_steps, _savedStepForms, _orderedSteps) => {
    const orderedNonDeckSteps = _orderedSteps.slice(1)

    return reduce(orderedNonDeckSteps, (acc, stepId) => {
      const nextStepData = (_steps[stepId] && _savedStepForms[stepId])
        ? validateAndProcessForm(_savedStepForms[stepId])
        // NOTE: usually, stepFormData is undefined here b/c there's no saved step form for it:
        : {
          errors: {'form': ['no saved form for step ' + stepId]},
          validatedForm: null
        } // TODO Ian 2018-03-20 revisit "no saved form for step"

      return {
        ...acc,
        [stepId]: nextStepData
      }
    }, {})
  }
)

const allSubsteps: Selector<{[StepIdType]: StepSubItemData | null}> = createSelector(
  validatedForms,
  equippedPipettes,
  labwareIngredSelectors.getLabware,
  (_validatedForms, _pipetteData, _allLabware) => {
    const allLabwareTypes: {[labwareId: string]: string} = mapValues(_allLabware, (l: LabwareData) => l.type)
    return generateSubsteps(_validatedForms, _pipetteData, allLabwareTypes)
  }
)

/** All Step data needed for Step List */
const allSteps = createSelector(
  getSteps,
  orderedStepsSelector,
  getCollapsedSteps,
  allSubsteps,
  getSavedForms,
  labwareIngredSelectors.getLabware,
  (steps, orderedSteps, collapsedSteps, _allSubsteps, _savedForms, _labware) => {
    return orderedSteps.map(id => {
      const savedForm = (_savedForms && _savedForms[id]) || {}

      function getLabwareName (labwareId: ?string) {
        return (labwareId)
          ? _labware[labwareId] && _labware[labwareId].name
          : null
      }

      // optional form fields for "transferish" steps
      const additionalFormFields = (
        savedForm.stepType === 'transfer' ||
        savedForm.stepType === 'distribute' ||
        savedForm.stepType === 'consolidate'
      )
        ? {
          sourceLabwareName: getLabwareName(savedForm['aspirate--labware']),
          destLabwareName: getLabwareName(savedForm['dispense--labware'])
        }
        : {}

      return {
        ...steps[id],

        ...additionalFormFields,
        description: savedForm['step-details'],

        collapsed: collapsedSteps[id],
        substeps: _allSubsteps[id]
      }
    })
  }
)

const selectedStepSelector = createSelector(
  allSteps,
  selectedStepId,
  (allSteps, selectedStepId) => {
    const stepId = selectedStepId

    if (!allSteps || stepId === null || stepId === '__end__') {
      return null
    }

    return allSteps[stepId]
  }
)

/** True if app is in Deck Setup Mode. */
const deckSetupMode: Selector<boolean> = createSelector(
  getSteps,
  hoveredOrSelectedStepId,
  (steps, selectedStepId) => (selectedStepId !== null && selectedStepId !== '__end__' && steps[selectedStepId])
    ? steps[selectedStepId].stepType === 'deck-setup'
    : false
)

/** Array of labware (labwareId's) involved in hovered Step, or [] */
const hoveredStepLabware: Selector<Array<string>> = createSelector(
  validatedForms,
  hoveredStepId,
  (_forms, _hoveredStep) => {
    const blank = []
    if (typeof _hoveredStep !== 'number' || !_forms[_hoveredStep]) {
      return blank
    }

    const stepForm = _forms[_hoveredStep].validatedForm

    if (
      !stepForm ||
      stepForm === null ||
      stepForm.stepType === 'pause' // no labware involved
    ) {
      return blank
    }

    const src = stepForm.sourceLabware
    const dest = stepForm.destLabware

    return [src, dest]
  }
)

const stepCreationButtonExpandedSelector: Selector<boolean> = createSelector(
  rootSelector,
  (state: RootState) => state.stepCreationButtonExpanded
)

const selectedStepFormDataSelector: Selector<boolean | FormData | BlankForm> = createSelector(
  getSavedForms,
  selectedStepId,
  getSteps,
  (savedStepForms, selectedStepId, steps) => {
    if (selectedStepId === null) {
      // no step selected
      return false
    }

    if (selectedStepId === '__end__' || steps[selectedStepId].stepType === 'deck-setup') {
      // End step has no stepType
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
)

const nextStepId: Selector<number> = createSelector( // generates the next step ID to use
  getSteps,
  (_steps): number => {
    const allStepIds = Object.keys(_steps).map(stepId => parseInt(stepId))
    return allStepIds.length === 0
      ? 0
      : max(allStepIds) + 1
  }
)

const currentFormErrors: Selector<null | {[errorName: string]: string}> = (state: BaseState) => {
  const form = formData(state)
  return form && validateAndProcessForm(form).errors // TODO refactor selectors
}

const currentFormCanBeSaved: Selector<boolean | null> = createSelector(
  formData,
  selectedStepId,
  allSteps,
  (formData, selectedStepId, allSteps) =>
    ((typeof selectedStepId === 'number') && allSteps[selectedStepId] && formData)
      ? !formHasErrors(
        validateAndProcessForm(formData)
      )
      : null
)

const formSectionCollapseSelector: Selector<FormSectionState> = createSelector(
  rootSelector,
  s => s.formSectionCollapse
)

export const selectors = {
  rootSelector,
  stepCreationButtonExpanded: stepCreationButtonExpandedSelector,
  allSteps,
  orderedSteps: orderedStepsSelector,
  selectedStep: selectedStepSelector,
  selectedStepId, // TODO replace with selectedStep: selectedStepSelector
  hoveredStepId,
  hoveredOrSelectedStepId,
  selectedStepFormData: selectedStepFormDataSelector,
  formData,
  formModalData,
  nextStepId,
  allSubsteps,
  validatedForms,
  currentFormErrors,
  currentFormCanBeSaved,
  formSectionCollapse: formSectionCollapseSelector,
  deckSetupMode,
  hoveredStepLabware
}

export default rootReducer
