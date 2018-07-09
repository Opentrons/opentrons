// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {ActionType} from 'redux-actions'
import omit from 'lodash/omit'

import {INITIAL_DECK_SETUP_ID} from './constants'
import {DECK_SETUP_TITLE} from '../constants'
import {getPDMetadata} from '../file-types'
import {END_STEP} from './types'

import type { StepItemData, FormSectionState, SubstepIdentifier } from './types'
import type {LoadFileAction} from '../load-file'
import type { FormData, StepIdType, FormModalFields } from '../form-types'

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
    // TODO: Ian 2018-06-14 type properly
    // $FlowFixMe
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
    title: DECK_SETUP_TITLE,
    stepType: 'deck-setup'
  }
}

const steps = handleActions({
  ADD_STEP: (state, action: AddStepAction) => ({
    ...state,
    [action.payload.id]: createDefaultStep(action)
  }),
  DELETE_STEP: (state, action: DeleteStepAction) => omit(state, action.payload.toString()),
  LOAD_FILE: (state: StepsState, action: LoadFileAction): StepsState => {
    const {savedStepForms, orderedSteps} = getPDMetadata(action.payload)
    return orderedSteps.reduce((acc: StepsState, stepId) => {
      const stepForm = savedStepForms[stepId]
      if (!stepForm) {
        if (stepId !== INITIAL_DECK_SETUP_ID) {
          console.warn(`Step id ${stepId} found in orderedSteps but not in savedStepForms`)
        }
        return acc
      }
      return {
        ...acc,
        [stepId]: {
          id: stepId,
          title: stepForm['step-name'],
          stepType: stepForm.stepType
        }
      }
    }, {...initialStepState})
  }
}, initialStepState)

type SavedStepFormState = {
  [StepIdType]: FormData
}

const savedStepForms = handleActions({
  SAVE_STEP_FORM: (state, action: SaveStepFormAction) => ({
    ...state,
    [action.payload.id]: action.payload
  }),
  DELETE_STEP: (state, action: DeleteStepAction) => omit(state, action.payload.toString()),
  LOAD_FILE: (state: SavedStepFormState, action: LoadFileAction): SavedStepFormState =>
    getPDMetadata(action.payload).savedStepForms
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

export type OrderedStepsState = Array<StepIdType>

const orderedSteps = handleActions({
  ADD_STEP: (state: OrderedStepsState, action: AddStepAction) =>
    [...state, action.payload.id],
  DELETE_STEP: (state: OrderedStepsState, action: DeleteStepAction) =>
    // TODO Ian 2018-05-10 standardize StepIdType to string, number is implicitly cast to string somewhere
    state.filter(stepId => !(stepId === action.payload || `${stepId}` === action.payload)),
  LOAD_FILE: (state: OrderedStepsState, action: LoadFileAction): OrderedStepsState =>
    [INITIAL_DECK_SETUP_ID, ...getPDMetadata(action.payload).orderedSteps]
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

export default rootReducer
