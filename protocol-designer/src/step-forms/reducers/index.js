// @flow
import {handleActions} from 'redux-actions'
import type {ActionType} from 'redux-actions'
import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'
import reduce from 'lodash/reduce'
import {uuid} from '../../utils'
import {
  INITIAL_DECK_SETUP_STEP_ID,
  FIXED_TRASH_ID,
} from '../../constants.js'

import {getPDMetadata} from '../../file-types'
import {getDefaultsForStepType} from '../../steplist/formLevel'

import type {LoadFileAction} from '../../load-file'
import type {
  CreateContainerAction,
  DeleteContainerAction,
} from '../../labware-ingred/actions'
import type {FormData, StepIdType} from '../../form-types'
import type {FileLabware, FilePipette} from '../../file-types'

import type {
  ChangeFormInputAction,
  DeleteStepAction,
  SaveStepFormAction,
  PopulateFormAction,
  SaveMoreOptionsModal,
} from '../../steplist/actions'

import {cancelStepForm} from '../../steplist/actions'
import {getChangeLabwareEffects} from '../../steplist/actions/handleFormChange'

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
const unsavedForm = (state: FormState = null, action: UnsavedFormActions): FormState => {
  switch (action.type) {
    case 'CHANGE_FORM_INPUT':
      // TODO: Ian 2018-12-13 use handleFormChange
      return {
        ...state,
        ...action.payload.update,
      }
    case 'POPULATE_FORM': return action.payload
    case 'CANCEL_STEP_FORM': return null
    case 'SAVE_STEP_FORM': return null
    case 'DELETE_STEP': return null
    // save the modal state into the unsavedForm --
    // it was 2 levels away from savedStepForms, now it's one level away
    case 'SAVE_MORE_OPTIONS_MODAL':
      return {...state, ...action.payload}
    default:
      return state
  }
}

type SavedStepFormState = {
  [StepIdType]: FormData,
}

const initialSavedStepFormsState: SavedStepFormState = {
  [INITIAL_DECK_SETUP_STEP_ID]: {
    stepType: 'manualIntervention',
    id: INITIAL_DECK_SETUP_STEP_ID,
    labwareLocationUpdate: {
      [FIXED_TRASH_ID]: '12',
    },
  },
}

// TODO Ian 2018-12-13 replace the other savedStepForms with this new one
const savedStepForms = (
  state: AllStepsState,
  action: SaveStepFormAction | DeleteStepAction | LoadFileAction | DeleteContainerAction
) => {
  const {savedStepForms} = state
  switch (action.type) {
    case 'SAVE_STEP_FORM':
      return {
        ...savedStepForms,
        [action.payload.id]: action.payload,
      }
    case 'DELETE_STEP':
      return omit(savedStepForms, action.payload.toString())
    case 'LOAD_FILE':
      // backwards compatibility: adds in INITIAL_DECK_SETUP_STEP_ID with fixed-trash
      // if protocol didn't have it
      const loadedStepForms = {
        ...initialSavedStepFormsState,
        ...getPDMetadata(action.payload).savedStepForms,
      }
      return mapValues(loadedStepForms, stepForm => ({
        ...getDefaultsForStepType(stepForm.stepType),
        ...stepForm,
      }))
    case 'DELETE_CONTAINER':
      return mapValues(savedStepForms, savedForm => {
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
    case 'CHANGE_SAVED_STEP_FORM':
      // TODO IMMEDIATELY do handleFormChange here with full state
      return {
        ...savedStepForms,
        [action.payload.stepId]: {
          ...(action.payload.stepId != null ? savedStepForms[action.payload.stepId] : {}),
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

type PipetteState = {[pipetteId: string]: {|
  name: string,
|}}

const initialLabwareState: LabwareState = {
  [FIXED_TRASH_ID]: {type: 'fixed-trash'},
}

// EXPERIMENT NOTE: copied from `containers` reducer. Slot + UI stuff stripped out.
// TODO IMMEDIATELY add * types back in
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
  // EXPERIMENT NOTE: 'RENAME_LABWARE' doesn't matter, no name in this reducer
  // EXPERIMENT NOTE: 'MOVE_LABWARE' doesn't matter, b/c steps don't care about slots
  LOAD_FILE: (state: LabwareState, action: LoadFileAction): LabwareState => {
    const file = action.payload
    // EXPERIMENT NOTE: no migration required!
    // TODO Ian 2018-12-13: this is just reconciling a 'type' vs
    // 'model' word mismatch, they mean the same thing just inconsistent
    return mapValues(file.labware, (fileLabware: FileLabware, id: string) => ({
      type: fileLabware.model,
    }))
  },
  CREATE_NEW_PROTOCOL: (
    state: LabwareState,
    action: {payload: *}
  ): LabwareState => {
    // EXPERIMENT TODO: to keep partitioned labware in sync, the uuid of the tiprackmodel
    // needs to be included in the action payload. This shouldn't require a thunk?
    const nextState = [action.payload.left, action.payload.right].reduce((acc: LabwareState, mount): LabwareState => {
      if (mount.tiprackModel) {
        const id = `${uuid()}:${String(mount.tiprackModel)}`
        return {
          ...acc,
          [id]: {
            // slot: nextEmptySlot(_loadedContainersBySlot(acc)),
            type: mount.tiprackModel,
            // disambiguationNumber: getNextDisambiguationNumber(acc, String(mount.tiprackModel)),
            id,
            // name: null,
          },
        }
      }
      return acc
    }, state)
    return nextState
  },
}, initialLabwareState)

// TODO IMMEDIATELY add 'any' types back in
const pipetteInvariantProperties = handleActions({
  LOAD_FILE: (state: PipetteState, action: LoadFileAction): PipetteState => {
    return mapValues(action.payload.pipettes, (filePipette: FilePipette): $Values<PipetteState> => ({
      name: filePipette.name || filePipette.model, // drop other fields.
      // EXPERIMENT HACK: in real life the model fallback needs to drop
      // the version suffix to convert back to a name;
      // this is an old backwards-compat thing anyway
    }))
  },
  UPDATE_PIPETTES: (state: PipetteState, action: any): PipetteState => {
    // EXPERIMENT HACK: messy code for annoying by-mount action shape
    // in the future, pipette ids could be created in these actions
    const left = action.payload.left
    const right = action.payload.right
    return {
      ...(left && left.model ? {left: {name: left.model}} : {}),
      ...(right && right.model ? {right: {name: right.model}} : {}),
    }
  },
  CREATE_NEW_PROTOCOL: (state: PipetteState, action: any): PipetteState => {
    // EXPERIMENT HACK: messy code for annoying by-mount action shape - same as UPDATE_PIPETTES
    const left = action.payload.left
    const right = action.payload.right
    return {
      ...(left && left.model ? {left: {name: left.model}} : {}),
      ...(right && right.model ? {right: {name: right.model}} : {}),
    }
  },
  // EXPERIMENT NOTE: we don't care about mount, so 'SWAP_PIPETTES' doesn't matter in this reducer
}, {})

type AllStepsState = {
  labwareInvariantProperties: LabwareState,
  pipetteInvariantProperties: PipetteState,
  savedStepForms: SavedStepFormState,
  unsavedForm: FormState,
}

// EXPERIMENT TODO: find some existing util to do this nested version of combineReducers
// which handles: 1) avoid duplicating initial state and 2) avoid creating new objects when there's no changes
const initialAllStepsState: AllStepsState = {
  labwareInvariantProperties: initialLabwareState, // labware ID to type
  pipetteInvariantProperties: {}, // pipette ID to specName (wrongly called 'model' as carry-over from existing pipettes reducer -- TODO rename (and in all selectors))
  savedStepForms: initialSavedStepFormsState,
  unsavedForm: null,
}
const allSteps = (state: AllStepsState = initialAllStepsState, action: any) => {
  return {
    labwareInvariantProperties: labwareInvariantProperties(state.labwareInvariantProperties, action),
    pipetteInvariantProperties: pipetteInvariantProperties(state.pipetteInvariantProperties, action),
    savedStepForms: savedStepForms(state, action),
    unsavedFrom: unsavedForm(state.unsavedForm, action),
  }
}

export type RootState = AllStepsState

const rootReducer = allSteps

export default rootReducer
