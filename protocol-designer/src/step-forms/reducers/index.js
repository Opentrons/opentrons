// @flow
import assert from 'assert'
import {handleActions} from 'redux-actions'
import type {ActionType} from 'redux-actions'
import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import reduce from 'lodash/reduce'

import {sortedSlotnames, type DeckSlot} from '@opentrons/components'
import {pipetteModelToName} from '../utils'
import {
  INITIAL_DECK_SETUP_STEP_ID,
  FIXED_TRASH_ID,
} from '../../constants.js'
import {getPDMetadata} from '../../file-types'
import {getDefaultsForStepType} from '../../steplist/formLevel'
import {cancelStepForm} from '../../steplist/actions'

import {getChangeLabwareEffects} from '../../steplist/actions/handleFormChange'

import type {PipetteEntity, LabwareEntities} from '../types'
import type {LoadFileAction} from '../../load-file'
import type {
  CreateContainerAction,
  DeleteContainerAction,
} from '../../labware-ingred/actions'
import type {FormData, StepIdType} from '../../form-types'
import type {FileLabware, FilePipette, ProtocolFile} from '../../file-types'

import type {
  AddStepAction,
  ChangeFormInputAction,
  DeleteStepAction,
  DuplicateStepAction,
  PopulateFormAction,
  ReorderSelectedStepAction,
  ReorderStepsAction,
  SaveStepFormAction,
} from '../../steplist/actions'
import type {StepItemData} from '../../steplist/types'
import type {
  SaveMoreOptionsModal,
} from '../../ui/steps/actions'
import type {
  CreatePipettesAction,
  DeletePipettesAction,
  ModifyPipettesTiprackAssignmentAction,
} from '../actions'

type FormState = FormData | null

const unsavedFormInitialState = null
// the `unsavedForm` state holds temporary form info that is saved or thrown away with "cancel".
type UnsavedFormActions =
  | ChangeFormInputAction
  | PopulateFormAction
  | ActionType<typeof cancelStepForm>
  | SaveStepFormAction
  | DeleteStepAction
  | SaveMoreOptionsModal
export const unsavedForm = (rootState: RootState, action: UnsavedFormActions): FormState => {
  const unsavedFormState = rootState ? rootState.unsavedForm : unsavedFormInitialState
  switch (action.type) {
    case 'CHANGE_FORM_INPUT':
      // TODO: Ian 2018-12-13 use handleFormChange
      return {
        ...unsavedFormState,
        ...action.payload.update,
      }
    case 'POPULATE_FORM': return action.payload
    case 'CANCEL_STEP_FORM': return unsavedFormInitialState
    case 'SELECT_TERMINAL_ITEM': return unsavedFormInitialState
    case 'SAVE_STEP_FORM': return unsavedFormInitialState
    case 'DELETE_STEP': return unsavedFormInitialState
    // save the modal state into the unsavedForm --
    // it was 2 levels away from savedStepForms, now it's one level away
    case 'SAVE_MORE_OPTIONS_MODAL':
      return {...unsavedFormState, ...action.payload}
    default:
      return unsavedFormState
  }
}

type SavedStepFormState = {
  [StepIdType]: FormData,
}

const initialDeckSetupStepForm: FormData = {
  stepType: 'manualIntervention',
  id: INITIAL_DECK_SETUP_STEP_ID,
  labwareLocationUpdate: {
    [FIXED_TRASH_ID]: '12',
  },
  pipetteLocationUpdate: {},
}

function _migratePreDeckSetupStep (fileData: ProtocolFile): FormData {
  // builds the initial deck setup step for older protocols that didn't have one.
  const additionalLabware = mapValues(fileData.labware, (labware: FileLabware) => labware.slot)
  const pipetteLocations = mapValues(fileData.pipettes, (pipette: FilePipette) => pipette.mount)

  return {
    ...initialDeckSetupStepForm,
    labwareLocationUpdate: {
      ...initialDeckSetupStepForm.labwareLocationUpdate,
      ...additionalLabware,
    },
    pipetteLocationUpdate: {
      ...initialDeckSetupStepForm.pipetteLocationUpdate,
      ...pipetteLocations,
    },
  }
}

function _getNextAvailableSlot (labwareLocations: {[labwareId: string]: DeckSlot}): ?DeckSlot {
  const filledLocations = Object.values(labwareLocations)
  return sortedSlotnames.find(slot => !filledLocations.some(filledSlot => filledSlot === slot))
}

const initialSavedStepFormsState: SavedStepFormState = {
  [INITIAL_DECK_SETUP_STEP_ID]: initialDeckSetupStepForm,
}
export const savedStepForms = (
  rootState: RootState,
  action: SaveStepFormAction | DeleteStepAction | LoadFileAction | CreateContainerAction | DeleteContainerAction
) => {
  const savedStepForms = rootState ? rootState.savedStepForms : initialSavedStepFormsState
  // TODO: Ian 2018-12-20 this switch-case makes it easy to get namespace conflicts using const's, and messes up flow. Try it a different way.
  switch (action.type) {
    case 'SAVE_STEP_FORM':
      return {
        ...savedStepForms,
        [action.payload.id]: action.payload,
      }
    case 'DELETE_STEP':
      return omit(savedStepForms, action.payload.toString())
    case 'LOAD_FILE':
      // backwards compatibility: adds in INITIAL_DECK_SETUP_STEP_ID with
      // all labware (from PD metadata) if there was no such step form
      const fileData = action.payload
      const stepFormsFromFile = getPDMetadata(action.payload).savedStepForms

      // only migrate if there's no initial deck setup step
      const loadedStepForms = (stepFormsFromFile[INITIAL_DECK_SETUP_STEP_ID])
        ? stepFormsFromFile
        : {
          [INITIAL_DECK_SETUP_STEP_ID]: _migratePreDeckSetupStep(fileData),
          ...stepFormsFromFile,
        }
      return mapValues(loadedStepForms, stepForm => ({
        ...getDefaultsForStepType(stepForm.stepType),
        ...stepForm,
      }))
    case 'CREATE_CONTAINER':
    // auto-update initial deck setup state.
      const prevInitialDeckSetupStep = savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
      const {id} = action.payload
      const slot = action.payload.slot || _getNextAvailableSlot(prevInitialDeckSetupStep.labwareLocationUpdate)
      if (!slot) {
        console.warn('no slots available, ignoring action:', action)
        return savedStepForms
      }
      return {
        ...savedStepForms,
        [INITIAL_DECK_SETUP_STEP_ID]: {
          ...prevInitialDeckSetupStep,
          labwareLocationUpdate: {
            ...prevInitialDeckSetupStep.labwareLocationUpdate,
            [id]: slot,
          },
        },
      }
    case 'DELETE_CONTAINER':
      return mapValues(savedStepForms, savedForm => {
        if (
          action.type === 'DELETE_CONTAINER' && // TODO Ian 2018-12-13 flow is not doing a good job understanding this switch-case
          savedForm.stepType === 'manualIntervention'
        ) {
          // remove instances of labware from all manualIntervention steps
          return {
            ...savedForm,
            labwareLocationUpdate: omit(savedForm.labwareLocationUpdate, action.payload.containerId),
          }
        }
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
    case 'DELETE_PIPETTES':
      // remove references to pipettes that have been deleted
      const deletedPipetteIds = action.payload
      return mapValues(savedStepForms, (form: FormData) => {
        if (form.stepType !== 'manualIntervention') {
          return omit(form, deletedPipetteIds)
        }
        return {
          ...form,
          pipetteLocationUpdate: omit(form.pipetteLocationUpdate, deletedPipetteIds),
        }
      })
    case 'CHANGE_SAVED_STEP_FORM':
      // TODO Ian 2018-12-13 do handleFormChange here with full state
      const {stepId} = action.payload
      const previousForm = savedStepForms[stepId]
      if (previousForm.stepType === 'manualIntervention') {
        // since manualIntervention steps are nested, use a recursive merge
        return {
          ...savedStepForms,
          [stepId]: merge(
            {},
            previousForm,
            action.payload.update,
          ),
        }
      }
      // other step form types are not designed to be deeply merged
      // (eg `wells` arrays should be reset, not appended to)
      return {
        ...savedStepForms,
        [stepId]: {
          ...previousForm,
          ...action.payload.update,
        },
      }
    case 'DUPLICATE_STEP':
      return {
        ...savedStepForms,
        [action.payload.duplicateStepId]: {
          ...cloneDeep(action.payload.stepId != null ? savedStepForms[action.payload.stepId] : {}),
          id: action.payload.duplicateStepId,
        },
      }
    default:
      return savedStepForms
  }
}

const initialLabwareState: LabwareEntities = {
  [FIXED_TRASH_ID]: {type: 'fixed-trash'},
}

// MIGRATION NOTE: copied from `containers` reducer. Slot + UI stuff stripped out.
export const labwareInvariantProperties = handleActions({
  CREATE_CONTAINER: (state: LabwareEntities, action: CreateContainerAction) => {
    return {
      ...state,
      [action.payload.id]: {type: action.payload.containerType},
    }
  },
  DELETE_CONTAINER: (state: LabwareEntities, action: DeleteContainerAction): LabwareEntities => {
    return omit(state, action.payload.containerId)
  },
  LOAD_FILE: (state: LabwareEntities, action: LoadFileAction): LabwareEntities => {
    const file = action.payload
    return mapValues(file.labware, (fileLabware: FileLabware, id: string) => ({
      type: fileLabware.model,
    }))
  },
}, initialLabwareState)

const initialPipetteState = {}
type PipetteInvariantState = {[pipetteId: string]: $Diff<PipetteEntity, {'spec': *}>}
export const pipetteInvariantProperties = handleActions({
  LOAD_FILE: (state: PipetteInvariantState, action: LoadFileAction): PipetteInvariantState => {
    const metadata = getPDMetadata(action.payload)
    return mapValues(action.payload.pipettes, (filePipette: FilePipette, pipetteId: string): $Values<PipetteInvariantState> => {
      const tiprackModel = metadata.pipetteTiprackAssignments[pipetteId]
      assert(tiprackModel, `expected tiprackModel in file metadata for pipette ${pipetteId}`)
      return {
        name: filePipette.name || pipetteModelToName(filePipette.model),
        tiprackModel,
      }
    })
  },
  CREATE_PIPETTES: (state: PipetteInvariantState, action: CreatePipettesAction): PipetteInvariantState => {
    return {
      ...state,
      ...action.payload,
    }
  },
  DELETE_PIPETTES: (state: PipetteInvariantState, action: DeletePipettesAction): PipetteInvariantState => {
    return omit(state, action.payload)
  },
  MODIFY_PIPETTES_TIPRACK_ASSIGNMENT: (state: PipetteInvariantState, action: ModifyPipettesTiprackAssignmentAction): PipetteInvariantState => {
    assert(
      Object.keys(action.payload).forEach(pipetteId => pipetteId in state),
      `pipettes in ${action.type} payload do not exist in state ${JSON.stringify(action.payload)}`)
    return merge({}, state, action.payload)
  },
}, initialPipetteState)

type OrderedStepsState = Array<StepIdType>
const initialOrderedStepsState = []
export const orderedSteps = handleActions({
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
}, initialOrderedStepsState)

// TODO: Ian 2018-12-19 DEPRECATED. This should be removed soon, but we need it until we
// move to not having "pristine" steps
type LegacyStepsState = {[StepIdType]: StepItemData}
const initialLegacyStepState: LegacyStepsState = {}
export const legacySteps = handleActions({
  ADD_STEP: (state, action: AddStepAction): LegacyStepsState => ({
    ...state,
    [action.payload.id]: action.payload,
  }),
  DELETE_STEP: (state, action: DeleteStepAction) => omit(state, action.payload.toString()),
  LOAD_FILE: (state: LegacyStepsState, action: LoadFileAction): LegacyStepsState => {
    const {savedStepForms, orderedSteps} = getPDMetadata(action.payload)
    return orderedSteps.reduce((acc: LegacyStepsState, stepId) => {
      const stepForm = savedStepForms[stepId]
      if (!stepForm) {
        console.warn(`Step id ${stepId} found in orderedSteps but not in savedStepForms`)
        return acc
      }
      return {
        ...acc,
        [stepId]: {
          id: stepId,
          stepType: stepForm.stepType,
        },
      }
    }, {...initialLegacyStepState})
  },
  DUPLICATE_STEP: (state: LegacyStepsState, action: DuplicateStepAction): LegacyStepsState => ({
    ...state,
    [action.payload.duplicateStepId]: {
      ...(action.payload.stepId != null ? state[action.payload.stepId] : {}),
      id: action.payload.duplicateStepId,
    },
  }),
}, initialLegacyStepState)

export type RootState = {
  orderedSteps: OrderedStepsState,
  labwareInvariantProperties: LabwareEntities,
  pipetteInvariantProperties: PipetteInvariantState,
  legacySteps: LegacyStepsState,
  savedStepForms: SavedStepFormState,
  unsavedForm: FormState,
}

// TODO Ian 2018-12-13: find some existing util to do this
// semi-nested version of combineReducers?
// TODO: Ian 2018-12-13 remove this 'action: any' type
const rootReducer = (state: RootState, action: any) => {
  const prevStateFallback = state || {}
  const nextState = {
    orderedSteps: orderedSteps(prevStateFallback.orderedSteps, action),
    labwareInvariantProperties: labwareInvariantProperties(prevStateFallback.labwareInvariantProperties, action),
    pipetteInvariantProperties: pipetteInvariantProperties(prevStateFallback.pipetteInvariantProperties, action),
    legacySteps: legacySteps(prevStateFallback.legacySteps, action),
    // 'forms' reducers get full rootReducer state
    savedStepForms: savedStepForms(state, action),
    unsavedForm: unsavedForm(state, action),
  }
  if (state && Object.keys(nextState).every(stateKey =>
    state[stateKey] === nextState[stateKey])
  ) {
    // no change
    return state
  }
  return nextState
}

export default rootReducer
