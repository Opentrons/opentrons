// @flow
import assert from 'assert'
import {handleActions} from 'redux-actions'
import type {ActionType} from 'redux-actions'
import mapValues from 'lodash/mapValues'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import reduce from 'lodash/reduce'

import {pipetteModelToName} from '../utils'
import {
  INITIAL_DECK_SETUP_STEP_ID,
  FIXED_TRASH_ID,
} from '../../constants.js'
import {getPDMetadata} from '../../file-types'
import {getDefaultsForStepType} from '../../steplist/formLevel'
import {cancelStepForm} from '../../steplist/actions'
import {getChangeLabwareEffects} from '../../steplist/actions/handleFormChange'

import type {CreateNewProtocolAction, LoadFileAction} from '../../load-file'
import type {
  CreateContainerAction,
  DeleteContainerAction,
} from '../../labware-ingred/actions'
import type {FormData, StepIdType} from '../../form-types'
import type {FileLabware, FilePipette, ProtocolFile} from '../../file-types'
import type {UpdatePipettesAction} from '../../pipettes'

import type {
  ChangeFormInputAction,
  DeleteStepAction,
  SaveStepFormAction,
  PopulateFormAction,
} from '../../steplist/actions'
import type {
  SaveMoreOptionsModal,
} from '../../ui/steps/actions'
import type {
  MovePipettesAction,
} from '../actions'

type FormState = FormData | null

// TODO Ian 2018-12-13 replace the other unsavedForm reducer with this new one
// the `unsavedForm` state holds temporary form info that is saved or thrown away with "cancel".
type UnsavedFormActions =
  | ChangeFormInputAction
  | PopulateFormAction
  | ActionType<typeof cancelStepForm>
  | SaveStepFormAction
  | DeleteStepAction
  | SaveMoreOptionsModal
const unsavedForm = (rootState: RootState, action: UnsavedFormActions): FormState => {
  const unsavedFormState = rootState.unsavedForm
  switch (action.type) {
    case 'CHANGE_FORM_INPUT':
      // TODO: Ian 2018-12-13 use handleFormChange
      return {
        ...unsavedFormState,
        ...action.payload.update,
      }
    case 'POPULATE_FORM': return action.payload
    case 'CANCEL_STEP_FORM': return null
    case 'SAVE_STEP_FORM': return null
    case 'DELETE_STEP': return null
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
  pipetteLocationUpdate: {}, // TODO SOON Ian 2018-12-13 sync pipette location with LOAD_FILE, MOVE_PIPETTES, UPDATE_PIPETTES, and CREATE_NEW_PROTOCOL.
}

const initialSavedStepFormsState: SavedStepFormState = {
  [INITIAL_DECK_SETUP_STEP_ID]: initialDeckSetupStepForm,
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

// TODO Ian 2018-12-13 replace the other savedStepForms with this new one
const savedStepForms = (
  rootState: RootState,
  action: SaveStepFormAction | DeleteStepAction | LoadFileAction | CreateContainerAction | DeleteContainerAction | MovePipettesAction
) => {
  const {savedStepForms} = rootState
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
    // TODO: Ian 2018-12-13 make the createLabware thunk separate into 2 actions:
    // create labware, then edit initial deck setup step form. This reducer will not have to handle CREATE_CONTAINER
    case 'CREATE_CONTAINER':
    // auto-update initial deck setup state.
      const prevInitialDeckSetupStep = savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
      const {id, slot} = action.payload
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
    case 'MOVE_PIPETTES':
      const formToMove = savedStepForms[action.payload.stepId]
      assert(
        formToMove && formToMove.stepType === 'manualIntervention',
        'expected MOVE_PIPETTES to reference a manualIntervention step')

      return {
        ...savedStepForms,
        [action.payload.stepId]: {
          ...formToMove,
          pipetteLocationUpdate: {
            ...formToMove.pipetteLocationUpdate,
            ...action.payload.update,
          },
        },
      }
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
          ...(action.payload.stepId != null ? savedStepForms[action.payload.stepId] : {}),
          id: action.payload.duplicateStepId,
        },
      }
    default:
      return savedStepForms
  }
}

type LabwareState = {[labwareId: string]: {|
  type: string,
|}}

const initialLabwareState: LabwareState = {
  [FIXED_TRASH_ID]: {type: 'fixed-trash'},
}

// MIGRATION NOTE: copied from `containers` reducer. Slot + UI stuff stripped out.
const labwareInvariantProperties = handleActions({
  CREATE_CONTAINER: (state: LabwareState, action: CreateContainerAction) => {
    return {
      ...state,
      [action.payload.id]: {type: action.payload.containerType},
    }
  },
  DELETE_CONTAINER: (state: LabwareState, action: DeleteContainerAction): LabwareState => {
    const res = omit(state, action.payload.containerId)
    console.log({res})
    return res
  },
  LOAD_FILE: (state: LabwareState, action: LoadFileAction): LabwareState => {
    const file = action.payload
    // TODO Ian 2018-12-13: this is just reconciling a 'type' vs
    // 'model' word mismatch, they mean the same thing just are inconsistent :(
    return mapValues(file.labware, (fileLabware: FileLabware, id: string) => ({
      type: fileLabware.model,
    }))
  },
  CREATE_NEW_PROTOCOL: (state: LabwareState, action: CreateNewProtocolAction): LabwareState => {
    const nextState = action.payload.tipracks.reduce((acc: LabwareState, tiprack): LabwareState => {
      const {id, model} = tiprack
      return {
        ...acc,
        [id]: {type: model},
      }
    }, state)
    return nextState
  },
}, initialLabwareState)

type PipetteState = {[pipetteId: string]: {|
  name: string,
|}}

const pipetteInvariantProperties = handleActions({
  LOAD_FILE: (state: PipetteState, action: LoadFileAction): PipetteState => {
    return mapValues(action.payload.pipettes, (filePipette: FilePipette): $Values<PipetteState> => ({
      name: filePipette.name || pipetteModelToName(filePipette.model),
    }))
  },
  UPDATE_PIPETTES: (state: PipetteState, action: UpdatePipettesAction): PipetteState => {
    // TODO Ian 2018-12-13: messy code for annoying by-mount action shape
    // in the future, pipette ids could be created in these actions
    const left = action.payload.left
    const right = action.payload.right
    return {
      ...(left && left.model ? {left: {name: left.model}} : {}),
      ...(right && right.model ? {right: {name: right.model}} : {}),
    }
  },
  CREATE_NEW_PROTOCOL: (state: PipetteState, action: CreateNewProtocolAction): PipetteState => {
    // TODO Ian 2018-12-13: messy code for annoying by-mount action shape
    // in the future, pipette ids could be created in these actions
    // (slightly different than for UPDATE_PIPETTES above)
    const left = action.payload.left
    const right = action.payload.right
    return {
      ...(left && left.pipetteModel ? {left: {name: left.pipetteModel}} : {}),
      ...(right && right.pipetteModel ? {right: {name: right.pipetteModel}} : {}),
    }
  },
}, {})

export type RootState = {
  labwareInvariantProperties: LabwareState,
  pipetteInvariantProperties: PipetteState,
  savedStepForms: SavedStepFormState,
  unsavedForm: FormState,
}

// TODO Ian 2018-12-13: find some existing util to do this nested version of combineReducers
// which avoids: 1) duplicating specifying initial state and 2) returning a new object when there's no change
const initialRootState: RootState = {
  labwareInvariantProperties: initialLabwareState,
  pipetteInvariantProperties: {},
  savedStepForms: initialSavedStepFormsState,
  unsavedForm: null,
}
// TODO: Ian 2018-12-13 remove this 'any' type
const rootReducer = (state: RootState = initialRootState, action: any) => {
  return {
    labwareInvariantProperties: labwareInvariantProperties(state.labwareInvariantProperties, action),
    pipetteInvariantProperties: pipetteInvariantProperties(state.pipetteInvariantProperties, action),
    savedStepForms: savedStepForms(state, action),
    unsavedForm: unsavedForm(state, action),
  }
}

export default rootReducer
