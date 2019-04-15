// @flow
import assert from 'assert'
import { handleActions } from 'redux-actions'
import type { ActionType } from 'redux-actions'
import mapValues from 'lodash/mapValues'
import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import reduce from 'lodash/reduce'

import {
  rootReducer as labwareDefsRootReducer,
  type RootState as LabwareDefsRootState,
} from '../../labware-defs'

import { INITIAL_DECK_SETUP_STEP_ID, FIXED_TRASH_ID } from '../../constants.js'
import { getPDMetadata } from '../../file-types'
import {
  getDefaultsForStepType,
  handleFormChange,
} from '../../steplist/formLevel'
import { cancelStepForm } from '../../steplist/actions'
import { _getHydratedLabwareEntitiesRootState } from '../selectors'

import type { LoadFileAction } from '../../load-file'
import type {
  CreateContainerAction,
  DeleteContainerAction,
  DuplicateLabwareAction,
  SwapSlotContentsAction,
} from '../../labware-ingred/actions'
import type { FormData, StepIdType } from '../../form-types'
import type {
  FileLabwareV1 as FileLabware,
  FilePipetteV1 as FilePipette,
} from '@opentrons/shared-data'

import type {
  AddStepAction,
  ChangeFormInputAction,
  ChangeSavedStepFormAction,
  DeleteStepAction,
  DuplicateStepAction,
  PopulateFormAction,
  ReorderSelectedStepAction,
  ReorderStepsAction,
  SaveStepFormAction,
} from '../../steplist/actions'
import type { StepItemData } from '../../steplist/types'
import type { NormalizedPipetteById, LabwareEntities } from '../types'
import type {
  CreatePipettesAction,
  DeletePipettesAction,
  SubstituteStepFormPipettesAction,
} from '../actions'
import {
  hydratePipetteEntities,
  getIdsInRange,
  getLabwareIdInSlot,
  pipetteModelToName,
} from '../utils'

type FormState = FormData | null

const unsavedFormInitialState = null
// the `unsavedForm` state holds temporary form info that is saved or thrown away with "cancel".
type UnsavedFormActions =
  | ChangeFormInputAction
  | PopulateFormAction
  | ActionType<typeof cancelStepForm>
  | SaveStepFormAction
  | DeleteStepAction
export const unsavedForm = (
  rootState: RootState,
  action: UnsavedFormActions
): FormState => {
  const unsavedFormState = rootState
    ? rootState.unsavedForm
    : unsavedFormInitialState
  switch (action.type) {
    case 'CHANGE_FORM_INPUT': {
      const fieldUpdate = handleFormChange(
        action.payload.update,
        unsavedFormState,
        hydratePipetteEntities(rootState.pipetteInvariantProperties),
        _getHydratedLabwareEntitiesRootState(rootState)
      )
      return {
        ...unsavedFormState,
        ...fieldUpdate,
      }
    }
    case 'POPULATE_FORM':
      return action.payload
    case 'CANCEL_STEP_FORM':
      return unsavedFormInitialState
    case 'SELECT_TERMINAL_ITEM':
      return unsavedFormInitialState
    case 'SAVE_STEP_FORM':
      return unsavedFormInitialState
    case 'DELETE_STEP':
      return unsavedFormInitialState
    case 'SUBSTITUTE_STEP_FORM_PIPETTES': {
      // only substitute unsaved step form if its ID is in the start-end range
      const { substitutionMap, startStepId, endStepId } = action.payload
      const stepIdsToUpdate = getIdsInRange(
        rootState.orderedStepIds,
        startStepId,
        endStepId
      )

      if (
        unsavedFormState &&
        unsavedFormState.pipette &&
        unsavedFormState.pipette in substitutionMap &&
        unsavedFormState.id &&
        stepIdsToUpdate.includes(unsavedFormState.id)
      ) {
        return {
          ...unsavedFormState,
          ...handleFormChange(
            { pipette: substitutionMap[unsavedFormState.pipette] },
            unsavedFormState,
            hydratePipetteEntities(rootState.pipetteInvariantProperties),
            _getHydratedLabwareEntitiesRootState(rootState)
          ),
        }
      }
      return unsavedFormState
    }
    default:
      return unsavedFormState
  }
}

export type SavedStepFormState = {
  [StepIdType]: FormData,
}

export const initialDeckSetupStepForm: FormData = {
  stepType: 'manualIntervention',
  id: INITIAL_DECK_SETUP_STEP_ID,
  labwareLocationUpdate: {
    [FIXED_TRASH_ID]: '12',
  },
  pipetteLocationUpdate: {},
}

const initialSavedStepFormsState: SavedStepFormState = {
  [INITIAL_DECK_SETUP_STEP_ID]: initialDeckSetupStepForm,
}
type SavedStepFormsActions =
  | SaveStepFormAction
  | DeleteStepAction
  | LoadFileAction
  | CreateContainerAction
  | DeleteContainerAction
  | SubstituteStepFormPipettesAction
  | DeletePipettesAction
  | DuplicateStepAction
  | ChangeSavedStepFormAction
  | DuplicateLabwareAction
  | SwapSlotContentsAction

export const savedStepForms = (
  rootState: RootState,
  action: SavedStepFormsActions
) => {
  const savedStepForms = rootState
    ? rootState.savedStepForms
    : initialSavedStepFormsState
  switch (action.type) {
    case 'SAVE_STEP_FORM': {
      return {
        ...savedStepForms,
        [action.payload.id]: action.payload,
      }
    }
    case 'DELETE_STEP': {
      return omit(savedStepForms, action.payload)
    }
    case 'LOAD_FILE': {
      const { file } = action.payload
      const stepFormsFromFile = getPDMetadata(file).savedStepForms

      return mapValues(stepFormsFromFile, stepForm => ({
        ...getDefaultsForStepType(stepForm.stepType),
        ...stepForm,
      }))
    }
    case 'DUPLICATE_LABWARE':
    case 'CREATE_CONTAINER': {
      // auto-update initial deck setup state.
      const prevInitialDeckSetupStep =
        savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
      const labwareId =
        action.type === 'CREATE_CONTAINER'
          ? action.payload.id
          : action.payload.duplicateLabwareId
      assert(
        prevInitialDeckSetupStep,
        'expected initial deck setup step to exist, could not handle CREATE_CONTAINER'
      )
      const slot = action.payload.slot
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
            [labwareId]: slot,
          },
        },
      }
    }
    case 'SWAP_SLOT_CONTENTS': {
      const { sourceSlot, destSlot } = action.payload
      return mapValues(savedStepForms, (savedForm: FormData) => {
        if (savedForm.stepType === 'manualIntervention') {
          // swap labware slots from all manualIntervention steps
          const sourceLabwareId = getLabwareIdInSlot(
            savedForm.labwareLocationUpdate,
            sourceSlot
          )
          const destLabwareId = getLabwareIdInSlot(
            savedForm.labwareLocationUpdate,
            destSlot
          )

          return {
            ...savedForm,
            labwareLocationUpdate: {
              ...savedForm.labwareLocationUpdate,
              ...(sourceLabwareId ? { [sourceLabwareId]: destSlot } : {}),
              ...(destLabwareId ? { [destLabwareId]: sourceSlot } : {}),
            },
          }
        }
        return savedForm
      })
    }
    case 'DELETE_CONTAINER': {
      const labwareIdToDelete = action.payload.labwareId
      return mapValues(savedStepForms, (savedForm: FormData) => {
        if (savedForm.stepType === 'manualIntervention') {
          // remove instances of labware from all manualIntervention steps
          return {
            ...savedForm,
            labwareLocationUpdate: omit(
              savedForm.labwareLocationUpdate,
              labwareIdToDelete
            ),
          }
        }
        const deleteLabwareUpdate = reduce(
          savedForm,
          (acc, value, fieldName) => {
            if (value === labwareIdToDelete) {
              return {
                ...acc,
                ...handleFormChange(
                  { [fieldName]: null },
                  acc,
                  hydratePipetteEntities(rootState.pipetteInvariantProperties),
                  _getHydratedLabwareEntitiesRootState(rootState)
                ),
              }
            } else {
              return acc
            }
          },
          savedForm
        )
        return {
          ...savedForm,
          ...deleteLabwareUpdate,
        }
      })
    }
    case 'DELETE_PIPETTES': {
      // remove references to pipettes that have been deleted
      const deletedPipetteIds = action.payload
      return mapValues(savedStepForms, (form: FormData) => {
        if (form.stepType === 'manualIntervention') {
          return {
            ...form,
            pipetteLocationUpdate: omit(
              form.pipetteLocationUpdate,
              deletedPipetteIds
            ),
          }
        } else if (deletedPipetteIds.includes(form.pipette)) {
          return {
            ...form,
            ...handleFormChange(
              { pipette: null },
              form,
              hydratePipetteEntities(rootState.pipetteInvariantProperties),
              _getHydratedLabwareEntitiesRootState(rootState)
            ),
          }
        }
        return form
      })
    }
    case 'SUBSTITUTE_STEP_FORM_PIPETTES': {
      const { startStepId, endStepId, substitutionMap } = action.payload
      const stepIdsToUpdate = getIdsInRange(
        rootState.orderedStepIds,
        startStepId,
        endStepId
      )
      const savedStepsUpdate = stepIdsToUpdate.reduce((acc, stepId) => {
        const prevStepForm = savedStepForms[stepId]

        const shouldSubstitute = Boolean(
          prevStepForm && // pristine forms will not exist in savedStepForms
            prevStepForm.pipette &&
            prevStepForm.pipette in substitutionMap
        )

        if (!shouldSubstitute) return acc

        const updatedFields = handleFormChange(
          { pipette: substitutionMap[prevStepForm.pipette] },
          prevStepForm,
          hydratePipetteEntities(rootState.pipetteInvariantProperties),
          _getHydratedLabwareEntitiesRootState(rootState)
        )

        return {
          ...acc,
          [stepId]: {
            ...prevStepForm,
            ...updatedFields,
          },
        }
      }, {})
      return { ...savedStepForms, ...savedStepsUpdate }
    }
    case 'CHANGE_SAVED_STEP_FORM': {
      const { stepId } = action.payload
      if (stepId == null) {
        assert(
          false,
          `savedStepForms got CHANGE_SAVED_STEP_FORM action without a stepId`
        )
        return savedStepForms
      }
      const previousForm = savedStepForms[stepId]
      if (previousForm.stepType === 'manualIntervention') {
        // since manualIntervention steps are nested, use a recursive merge
        return {
          ...savedStepForms,
          [stepId]: merge({}, previousForm, action.payload.update),
        }
      }
      // other step form types are not designed to be deeply merged
      // (eg `wells` arrays should be reset, not appended to)
      return {
        ...savedStepForms,
        [stepId]: {
          ...previousForm,
          ...handleFormChange(
            action.payload.update,
            previousForm,
            hydratePipetteEntities(rootState.pipetteInvariantProperties),
            _getHydratedLabwareEntitiesRootState(rootState)
          ),
        },
      }
    }
    case 'DUPLICATE_STEP': {
      return {
        ...savedStepForms,
        [action.payload.duplicateStepId]: {
          ...cloneDeep(
            action.payload.stepId != null
              ? savedStepForms[action.payload.stepId]
              : {}
          ),
          id: action.payload.duplicateStepId,
        },
      }
    }

    default:
      return savedStepForms
  }
}

const initialLabwareState: LabwareEntities = {
  [FIXED_TRASH_ID]: { type: 'fixed-trash' },
}

// MIGRATION NOTE: copied from `containers` reducer. Slot + UI stuff stripped out.
export const labwareInvariantProperties = handleActions(
  {
    CREATE_CONTAINER: (
      state: LabwareEntities,
      action: CreateContainerAction
    ) => {
      return {
        ...state,
        [action.payload.id]: { type: action.payload.containerType },
      }
    },
    DUPLICATE_LABWARE: (
      state: LabwareEntities,
      action: DuplicateLabwareAction
    ) => {
      return {
        ...state,
        [action.payload.duplicateLabwareId]: {
          type: state[action.payload.templateLabwareId].type,
        },
      }
    },
    DELETE_CONTAINER: (
      state: LabwareEntities,
      action: DeleteContainerAction
    ): LabwareEntities => {
      return omit(state, action.payload.labwareId)
    },
    LOAD_FILE: (
      state: LabwareEntities,
      action: LoadFileAction
    ): LabwareEntities => {
      const { file } = action.payload
      return mapValues(
        file.labware,
        (fileLabware: FileLabware, id: string) => ({
          type: fileLabware.model,
        })
      )
    },
  },
  initialLabwareState
)

const initialPipetteState = {}
export const pipetteInvariantProperties = handleActions(
  {
    LOAD_FILE: (
      state: NormalizedPipetteById,
      action: LoadFileAction
    ): NormalizedPipetteById => {
      const { file } = action.payload
      const metadata = getPDMetadata(file)
      return mapValues(
        file.pipettes,
        (
          filePipette: FilePipette,
          pipetteId: string
        ): $Values<NormalizedPipetteById> => {
          const tiprackModel = metadata.pipetteTiprackAssignments[pipetteId]
          assert(
            tiprackModel,
            `expected tiprackModel in file metadata for pipette ${pipetteId}`
          )
          return {
            id: pipetteId,
            name: filePipette.name || pipetteModelToName(filePipette.model),
            tiprackModel,
          }
        }
      )
    },
    CREATE_PIPETTES: (
      state: NormalizedPipetteById,
      action: CreatePipettesAction
    ): NormalizedPipetteById => {
      return {
        ...state,
        ...action.payload,
      }
    },
    DELETE_PIPETTES: (
      state: NormalizedPipetteById,
      action: DeletePipettesAction
    ): NormalizedPipetteById => {
      return omit(state, action.payload)
    },
  },
  initialPipetteState
)

type OrderedStepIdsState = Array<StepIdType>
const initialOrderedStepIdsState = []
export const orderedStepIds = handleActions(
  {
    ADD_STEP: (state: OrderedStepIdsState, action: AddStepAction) => [
      ...state,
      action.payload.id,
    ],
    DELETE_STEP: (state: OrderedStepIdsState, action: DeleteStepAction) =>
      state.filter(stepId => stepId !== action.payload),
    LOAD_FILE: (
      state: OrderedStepIdsState,
      action: LoadFileAction
    ): OrderedStepIdsState => getPDMetadata(action.payload.file).orderedStepIds,
    REORDER_SELECTED_STEP: (
      state: OrderedStepIdsState,
      action: ReorderSelectedStepAction
    ): OrderedStepIdsState => {
      // TODO: BC 2018-11-27 make util function for reordering and use it everywhere
      const { delta, stepId } = action.payload
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
    DUPLICATE_STEP: (
      state: OrderedStepIdsState,
      action: DuplicateStepAction
    ): OrderedStepIdsState => {
      const { stepId, duplicateStepId } = action.payload
      const selectedIndex = state.findIndex(s => s === stepId)

      return [
        ...state.slice(0, selectedIndex + 1),
        duplicateStepId,
        ...state.slice(selectedIndex + 1, state.length),
      ]
    },
    REORDER_STEPS: (
      state: OrderedStepIdsState,
      action: ReorderStepsAction
    ): OrderedStepIdsState => action.payload.stepIds,
  },
  initialOrderedStepIdsState
)

// TODO: Ian 2018-12-19 DEPRECATED. This should be removed soon, but we need it until we
// move to not having "pristine" steps
type LegacyStepsState = { [StepIdType]: StepItemData }
const initialLegacyStepState: LegacyStepsState = {}
export const legacySteps = handleActions(
  {
    ADD_STEP: (state, action: AddStepAction): LegacyStepsState => ({
      ...state,
      [action.payload.id]: action.payload,
    }),
    DELETE_STEP: (state, action: DeleteStepAction) =>
      omit(state, action.payload.toString()),
    LOAD_FILE: (
      state: LegacyStepsState,
      action: LoadFileAction
    ): LegacyStepsState => {
      const { savedStepForms, orderedStepIds } = getPDMetadata(
        action.payload.file
      )
      return orderedStepIds.reduce(
        (acc: LegacyStepsState, stepId) => {
          const stepForm = savedStepForms[stepId]
          if (!stepForm) {
            console.warn(
              `Step id ${stepId} found in orderedStepIds but not in savedStepForms`
            )
            return acc
          }
          return {
            ...acc,
            [stepId]: {
              id: stepId,
              stepType: stepForm.stepType,
            },
          }
        },
        { ...initialLegacyStepState }
      )
    },
    DUPLICATE_STEP: (
      state: LegacyStepsState,
      action: DuplicateStepAction
    ): LegacyStepsState => ({
      ...state,
      [action.payload.duplicateStepId]: {
        ...(action.payload.stepId != null ? state[action.payload.stepId] : {}),
        id: action.payload.duplicateStepId,
      },
    }),
  },
  initialLegacyStepState
)

export type RootState = {
  orderedStepIds: OrderedStepIdsState,
  labwareDefs: LabwareDefsRootState,
  labwareInvariantProperties: LabwareEntities,
  pipetteInvariantProperties: NormalizedPipetteById,
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
    orderedStepIds: orderedStepIds(prevStateFallback.orderedStepIds, action),
    labwareInvariantProperties: labwareInvariantProperties(
      prevStateFallback.labwareInvariantProperties,
      action
    ),
    pipetteInvariantProperties: pipetteInvariantProperties(
      prevStateFallback.pipetteInvariantProperties,
      action
    ),
    labwareDefs: labwareDefsRootReducer(prevStateFallback.labwareDefs, action),
    legacySteps: legacySteps(prevStateFallback.legacySteps, action),
    // 'forms' reducers get full rootReducer state
    savedStepForms: savedStepForms(state, action),
    unsavedForm: unsavedForm(state, action),
  }
  if (
    state &&
    Object.keys(nextState).every(
      stateKey => state[stateKey] === nextState[stateKey]
    )
  ) {
    // no change
    return state
  }
  return nextState
}

export default rootReducer
