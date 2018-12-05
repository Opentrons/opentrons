// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {ActionType, Reducer} from 'redux-actions'
import omit from 'lodash/omit'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'

import {getPDMetadata} from '../file-types'

import {START_TERMINAL_ITEM_ID} from './types'
import type {
  StepItemData,
  FormSectionState,
  SubstepIdentifier,
  TerminalItemId,
} from './types'
import type {LoadFileAction} from '../load-file'
import type {DeleteContainerAction} from '../labware-ingred/actions'
import type {FormData, StepIdType, FormModalFields} from '../form-types'
import {getDefaultsForStepType} from './formLevel'

import type {
  AddStepAction,
  ChangeFormInputAction,
  DeleteStepAction,
  ReorderStepsAction,
  ReorderSelectedStepAction,
  DuplicateStepAction,
  SaveStepFormAction,
  SelectStepAction,
  SelectTerminalItemAction,
  PopulateFormAction,
  CollapseFormSectionAction, // <- TODO this isn't a thunk

  ChangeMoreOptionsModalInputAction,
  OpenMoreOptionsModal,
  SaveMoreOptionsModal,
} from './actions' // Thunk action creators

import {
  cancelStepForm, // TODO try collapsing them all into a single Action type
  saveStepForm,
  hoverOnSubstep,
  expandAddStepButton,
  hoverOnStep,
  hoverOnTerminalItem,
  toggleStepCollapsed,
  type ChangeSavedStepFormAction,
} from './actions'
import {getChangeLabwareEffects} from './actions/handleFormChange'

type FormState = FormData | null

// the `unsavedForm` state holds temporary form info that is saved or thrown away with "cancel".
const unsavedForm: Reducer<FormState, *> = handleActions({
  CHANGE_FORM_INPUT: (state: FormState, action: ChangeFormInputAction) => {
    // TODO: Ian 2018-06-14 type properly
    // $FlowFixMe
    return {
      ...state,
      ...action.payload.update,
    }
  },
  POPULATE_FORM: (state, action: PopulateFormAction) => action.payload,
  CANCEL_STEP_FORM: (state, action: ActionType<typeof cancelStepForm>) => null,
  SAVE_STEP_FORM: (state, action: ActionType<typeof saveStepForm>) => null,
  DELETE_STEP: () => null,
  // save the modal state into the unsavedForm --
  // it was 2 levels away from savedStepForms, now it's one level away
  SAVE_MORE_OPTIONS_MODAL: (state, action: SaveMoreOptionsModal) => ({...state, ...action.payload}),
}, null)

// Handles aspirate / dispense form sections opening / closing
export const initialFormSectionState: FormSectionState = {aspirate: true, dispense: true}

const formSectionCollapse = handleActions({
  COLLAPSE_FORM_SECTION: (state, action: CollapseFormSectionAction) =>
    ({...state, [action.payload]: !state[action.payload]}),
  // exiting the form resets the collapse state
  CANCEL_STEP_FORM: () => initialFormSectionState,
  SAVE_STEP_FORM: () => initialFormSectionState,
  POPULATE_FORM: () => initialFormSectionState,
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
  DELETE_STEP: () => null,
}, null)

type StepsState = {[StepIdType]: StepItemData}

const initialStepState = {}

const steps: Reducer<StepsState, *> = handleActions({
  ADD_STEP: (state, action: AddStepAction): StepsState => ({
    ...state,
    [action.payload.id]: createDefaultStep(action),
  }),
  DELETE_STEP: (state, action: DeleteStepAction) => omit(state, action.payload.toString()),
  LOAD_FILE: (state: StepsState, action: LoadFileAction): StepsState => {
    const {savedStepForms, orderedSteps} = getPDMetadata(action.payload)
    return orderedSteps.reduce((acc: StepsState, stepId) => {
      const stepForm = savedStepForms[stepId]
      if (!stepForm) {
        console.warn(`Step id ${stepId} found in orderedSteps but not in savedStepForms`)
        return acc
      }
      return {
        ...acc,
        [stepId]: {
          id: stepId,
          title: stepForm['step-name'],
          stepType: stepForm.stepType,
        },
      }
    }, {...initialStepState})
  },
  DUPLICATE_STEP: (state: StepsState, action: DuplicateStepAction): StepsState => ({
    ...state,
    [action.payload.duplicateStepId]: {
      ...(action.payload.stepId != null ? state[action.payload.stepId] : {}),
      id: action.payload.duplicateStepId,
    },
  }),
}, initialStepState)

type SavedStepFormState = {
  [StepIdType]: FormData,
}

const savedStepForms: Reducer<SavedStepFormState, *> = handleActions({
  SAVE_STEP_FORM: (state, action: SaveStepFormAction) => ({
    ...state,
    [action.payload.id]: action.payload,
  }),
  DELETE_STEP: (state, action: DeleteStepAction) => omit(state, action.payload.toString()),
  LOAD_FILE: (state: SavedStepFormState, action: LoadFileAction): SavedStepFormState => {
    const loadedStepForms = getPDMetadata(action.payload).savedStepForms
    return mapValues(loadedStepForms, stepForm => ({
      ...getDefaultsForStepType(stepForm.stepType),
      ...stepForm,
    }))
  },
  DELETE_CONTAINER: (state: SavedStepFormState, action: DeleteContainerAction): SavedStepFormState => (
    mapValues(state, savedForm => {
      const deleteLabwareUpdate = reduce(savedForm, (acc, value, fieldName) => {
        if (value === action.payload.containerId) {
          const formLabwareFieldUpdate = {[fieldName]: null}
          return {
            ...acc,
            ...formLabwareFieldUpdate,
            ...getChangeLabwareEffects(formLabwareFieldUpdate),
          }
        } else {
          return acc
        }
      }, {})
      return {
        ...savedForm,
        ...deleteLabwareUpdate,
      }
    })
  ),
  CHANGE_SAVED_STEP_FORM: (state: SavedStepFormState, action: ChangeSavedStepFormAction): SavedStepFormState => ({
    ...state,
    [action.payload.stepId]: {
      ...(action.payload.stepId != null ? state[action.payload.stepId] : {}),
      ...action.payload.update,
    },
  }),
  DUPLICATE_STEP: (state: SavedStepFormState, action: DuplicateStepAction): SavedStepFormState => ({
    ...state,
    [action.payload.duplicateStepId]: {
      ...(action.payload.stepId != null ? state[action.payload.stepId] : {}),
      id: action.payload.duplicateStepId,
    },
  }),
}, {})

type CollapsedStepsState = {
  [StepIdType]: boolean,
}

const collapsedSteps: Reducer<CollapsedStepsState, *> = handleActions({
  ADD_STEP: (state: CollapsedStepsState, action: AddStepAction) => ({
    ...state,
    [action.payload.id]: false,
  }),
  DELETE_STEP: (state: CollapsedStepsState, action: DeleteStepAction) =>
    omit(state, action.payload.toString()),
  TOGGLE_STEP_COLLAPSED: (state: CollapsedStepsState, {payload}: ActionType<typeof toggleStepCollapsed>) => ({
    ...state,
    [payload]: !state[payload],
  }),
  LOAD_FILE: (state: CollapsedStepsState, action: LoadFileAction) =>
    // default all steps to collapsed
    getPDMetadata(action.payload).orderedSteps.reduce(
      (acc: CollapsedStepsState, stepId) => ({...acc, [stepId]: true}),
      {}
    ),
}, {})

export type OrderedStepsState = Array<StepIdType>

const orderedSteps: Reducer<OrderedStepsState, *> = handleActions({
  ADD_STEP: (state: OrderedStepsState, action: AddStepAction) =>
    [...state, action.payload.id],
  DELETE_STEP: (state: OrderedStepsState, action: DeleteStepAction) =>
    state.filter(stepId => stepId !== action.payload),
  LOAD_FILE: (state: OrderedStepsState, action: LoadFileAction): OrderedStepsState =>
    getPDMetadata(action.payload).orderedSteps,
  REORDER_SELECTED_STEP: (state: OrderedStepsState, action: ReorderSelectedStepAction): OrderedStepsState => {
    // TODO: BC 2018-11-27 make util function for reordering and use it everywhere
    const {delta, stepId} = action.payload
    const stepsWithoutSelectedStep = state.filter(s => s !== stepId)
    const selectedIndex = state.findIndex(s => s === stepId)
    const nextIndex = selectedIndex + delta

    if (delta <= 0 && selectedIndex === 0) return state

    return [
      ...stepsWithoutSelectedStep.slice(0, nextIndex),
      stepId,
      ...stepsWithoutSelectedStep.slice(nextIndex),
    ]
  },
  DUPLICATE_STEP: (state: OrderedStepsState, action: DuplicateStepAction): OrderedStepsState => {
    const {stepId, duplicateStepId} = action.payload
    const selectedIndex = state.findIndex(s => s === stepId)

    return [
      ...state.slice(0, selectedIndex + 1),
      duplicateStepId,
      ...state.slice(selectedIndex + 1, state.length),
    ]
  },
  REORDER_STEPS: (state: OrderedStepsState, action: ReorderStepsAction): OrderedStepsState => (
    action.payload.stepIds
  ),
}, [])

export type SelectableItem = {
  isStep: true,
  id: StepIdType,
} | {
  isStep: false,
  id: TerminalItemId,
}

type SelectedItemState = ?SelectableItem

function stepIdHelper (id: ?StepIdType): SelectedItemState {
  if (id == null) return null
  return {
    isStep: true,
    id,
  }
}

function terminalItemIdHelper (id: ?TerminalItemId): SelectedItemState {
  if (id == null) return null
  return {
    isStep: false,
    id,
  }
}

export const initialSelectedItemState = {
  isStep: false,
  id: START_TERMINAL_ITEM_ID,
}

const selectedItem: Reducer<SelectedItemState, *> = handleActions({
  SELECT_STEP: (state: SelectedItemState, action: SelectStepAction) =>
    stepIdHelper(action.payload),
  SELECT_TERMINAL_ITEM: (state: SelectedItemState, action: SelectTerminalItemAction) =>
    terminalItemIdHelper(action.payload),
  DELETE_STEP: () => null,
}, initialSelectedItemState)

type HoveredItemState = SelectedItemState

const hoveredItem: Reducer<HoveredItemState, *> = handleActions({
  HOVER_ON_STEP: (state: HoveredItemState, action: ActionType<typeof hoverOnStep>) =>
    stepIdHelper(action.payload),
  HOVER_ON_TERMINAL_ITEM: (state: HoveredItemState, action: ActionType<typeof hoverOnTerminalItem>) =>
    terminalItemIdHelper(action.payload),
}, null)

const hoveredSubstep = handleActions({
  HOVER_ON_SUBSTEP: (state: SubstepIdentifier, action: ActionType<typeof hoverOnSubstep>) => action.payload,
}, null)

type StepCreationButtonExpandedState = boolean

const stepCreationButtonExpanded = handleActions({
  ADD_STEP: () => false,
  EXPAND_ADD_STEP_BUTTON: (
    state: StepCreationButtonExpandedState,
    {payload}: ActionType<typeof expandAddStepButton>
  ) =>
    payload,
}, false)

const wellSelectionLabwareKey = handleActions({
  SET_WELL_SELECTION_LABWARE_KEY: (state, action: {payload: string}) => action.payload,
  CLEAR_WELL_SELECTION_LABWARE_KEY: () => null,
}, null)

export type RootState = {|
  unsavedForm: FormState,
  unsavedFormModal: FormModalFields,
  formSectionCollapse: FormSectionState,
  steps: StepsState,
  savedStepForms: SavedStepFormState,
  collapsedSteps: CollapsedStepsState,
  orderedSteps: OrderedStepsState,
  selectedItem: SelectedItemState,
  hoveredItem: HoveredItemState,
  hoveredSubstep: SubstepIdentifier,
  stepCreationButtonExpanded: StepCreationButtonExpandedState,
  wellSelectionLabwareKey: ?string,
|}

export const _allReducers = {
  unsavedForm,
  unsavedFormModal,
  formSectionCollapse,
  steps,
  savedStepForms,
  collapsedSteps,
  orderedSteps,
  selectedItem,
  hoveredItem,
  hoveredSubstep,
  stepCreationButtonExpanded,
  wellSelectionLabwareKey,
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer
