// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {ActionType} from 'redux-actions'
import {createSelector} from 'reselect'
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import max from 'lodash/max'
import omit from 'lodash/omit'

import {INITIAL_DECK_SETUP_ID} from './constants'

import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'

import {END_STEP} from './types'
import type {BaseState, Selector} from '../types'

import type {
  StepItemData,
  FormSectionState,
  SubstepIdentifier
} from './types'

import type {
  FormData,
  BlankForm,
  StepIdType,
  FormModalFields
} from '../form-types'

import {
  type ValidFormAndErrors,
  generateNewForm,
  validateAndProcessForm,
  formHasErrors
} from './formProcessing'

import type {
  AddStepAction,
  ChangeFormInputAction,
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
  hoverOnSubstep,
  expandAddStepButton,
  hoverOnStep,
  toggleStepCollapsed
} from './actions'

type FormState = FormData | null

// the `unsavedForm` state holds temporary form info that is saved or thrown away with "cancel".
const unsavedForm = handleActions({
  CHANGE_FORM_INPUT: (state: FormState, action: ChangeFormInputAction) => {
    // $FlowFixMe TODO IMMEDIATELY
    return {
      ...state,
      ...action.payload.update
    }
  },
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
// TODO: Ian 2018-01-26 don't add any default values, the allSteps selector generates the title
function createDefaultStep (action: AddStepAction) {
  const {stepType} = action.payload
  return {...action.payload, title: stepType}
}

// the form modal (MORE OPTIONS) is an unsaved version of unsavedForm.
// It's 2 degrees away from actual savedStepForms.
const unsavedFormModal = handleActions({
  OPEN_MORE_OPTIONS_MODAL: (state, action: OpenMoreOptionsModal) => action.payload,
  CHANGE_MORE_OPTIONS_MODAL_INPUT: (state, action: ChangeMoreOptionsModalInputAction) =>
    ({...state, ...action.payload.update}),
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
  }),
  DELETE_STEP: (state, action: DeleteStepAction) => omit(state, action.payload.toString())
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
    // TODO Ian 2018-05-10 standardize StepIdType to string, number is implicitly cast to string somewhere
    state.filter(stepId => !(stepId === action.payload || `${stepId}` === action.payload))
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

const hoveredSubstep = handleActions({
  HOVER_ON_SUBSTEP: (state: SubstepIdentifier, action: ActionType<typeof hoverOnSubstep>) => action.payload
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
  hoveredSubstep: SubstepIdentifier,
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
  hoveredSubstep,
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

const getHoveredSubstep: Selector<SubstepIdentifier> = createSelector(
  rootSelector,
  (state: RootState) => state.hoveredSubstep
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

const orderedStepsSelector: Selector<OrderedStepsState> = createSelector(
  rootSelector,
  (state: RootState) => state.orderedSteps
)

/** This is just a simple selector, but has some debugging logic. TODO Ian 2018-03-20: use assert here */
const getSavedForms: Selector<{[StepIdType]: FormData}> = createSelector(
  getSteps,
  orderedStepsSelector,
  (state: BaseState) => rootSelector(state).savedStepForms,
  (_steps, _orderedSteps, _savedStepForms) => {
    if (_orderedSteps.length === 0) {
      // No steps -- since initial Deck Setup step exists in default Redux state,
      // this probably should never happen
      console.warn('validatedForms called with no steps in "orderedSteps"')
      return {}
    }

    if (_steps[0].stepType !== 'deck-setup') {
      console.error('Error: expected deck-setup to be first step.', _orderedSteps)
    }

    _orderedSteps.slice(1).forEach(stepId => {
      if (!_steps[stepId]) {
        console.error(`Encountered an undefined step: ${stepId}`)
      } else if (_steps[stepId].stepType === 'deck-setup') {
        console.error('Encountered a deck-setup step which was not the first step in orderedSteps. This is not supported yet.')
      }
    })

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

    if (!stepForm) {
      return blank
    }

    if (
      stepForm.stepType === 'consolidate' ||
      stepForm.stepType === 'distribute' ||
      stepForm.stepType === 'transfer'
    ) {
      // source and dest labware
      const src = stepForm.sourceLabware
      const dest = stepForm.destLabware

      return [src, dest]
    }

    if (stepForm.stepType === 'mix') {
      // only 1 labware
      return [stepForm.labware]
    }

    // step types that have no labware that gets highlighted
    if (!(stepForm.stepType === 'pause')) {
      // TODO Ian 2018-05-08 use assert here
      console.warn(`hoveredStepLabware does not support step type "${stepForm.stepType}"`)
    }

    return blank
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

    if (
      selectedStepId === '__end__' ||
      !steps[selectedStepId] ||
      steps[selectedStepId].stepType === 'deck-setup'
    ) {
      // End step has no stepType
      // Deck Setup step has no form data
      // Also skip undefined steps to avoid white-screening, though they shouldn't happen
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

const formSectionCollapseSelector: Selector<FormSectionState> = createSelector(
  rootSelector,
  s => s.formSectionCollapse
)

export const allSteps: Selector<{[stepId: StepIdType]: StepItemData}> = createSelector(
  getSteps,
  getCollapsedSteps,
  getSavedForms,
  labwareIngredSelectors.getLabware,
  (steps, collapsedSteps, _savedForms, _labware) => {
    return mapValues(
      steps,
      (step: StepItemData, id: StepIdType): StepItemData => {
        const savedForm = (_savedForms && _savedForms[id]) || null

        // Assign the step title
        let title

        if (savedForm && savedForm['step-name']) {
          title = savedForm['step-name']
        } else if (step.stepType === 'deck-setup') {
          title = 'Deck Setup'
        } else {
          title = `${step.stepType} ${id}`
        }

        return {
          ...steps[id],
          formData: savedForm,
          title,
          description: savedForm ? savedForm['step-details'] : null
        }
      }
    )
  }
)

export const selectedStepSelector = createSelector(
  allSteps,
  selectedStepId,
  (_allSteps, selectedStepId) => {
    const stepId = selectedStepId

    if (!_allSteps || stepId === null || stepId === '__end__') {
      return null
    }

    return _allSteps[stepId]
  }
)

export const currentFormCanBeSaved: Selector<boolean | null> = createSelector(
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

export const selectors = {
  rootSelector,

  allSteps,
  currentFormCanBeSaved,
  selectedStep: selectedStepSelector,

  stepCreationButtonExpanded: stepCreationButtonExpandedSelector,
  orderedSteps: orderedStepsSelector,
  selectedStepId, // TODO replace with selectedStep: selectedStepSelector
  hoveredStepId,
  hoveredOrSelectedStepId,
  getHoveredSubstep,
  selectedStepFormData: selectedStepFormDataSelector,
  formData,
  formModalData,
  nextStepId,
  validatedForms,
  currentFormErrors,
  formSectionCollapse: formSectionCollapseSelector,
  deckSetupMode,
  hoveredStepLabware,

  // NOTE: these are exposed only for substeps/selectors.js
  getSteps,
  orderedStepsSelector,
  getCollapsedSteps,
  getSavedForms
}

export default rootReducer
