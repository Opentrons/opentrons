// @flow
import assert from 'assert'
import { handleActions } from 'redux-actions'
import mapValues from 'lodash/mapValues'
import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import reduce from 'lodash/reduce'
import {
  getLabwareDefURI,
  getModuleTypeFromModuleModel,
  MAGNETIC_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  rootReducer as labwareDefsRootReducer,
  type RootState as LabwareDefsRootState,
} from '../../labware-defs'
import {
  INITIAL_DECK_SETUP_STEP_ID,
  FIXED_TRASH_ID,
  SPAN7_8_10_11_SLOT,
} from '../../constants'
import { getPDMetadata } from '../../file-types'
import {
  getDefaultsForStepType,
  handleFormChange,
} from '../../steplist/formLevel'
import { cancelStepForm } from '../../steplist/actions'
import {
  _getPipetteEntitiesRootState,
  _getLabwareEntitiesRootState,
} from '../selectors'
import { getIdsInRange, getDeckItemIdInSlot } from '../utils'

import type { ActionType } from 'redux-actions'
import type { LoadFileAction } from '../../load-file'
import type {
  CreateContainerAction,
  DeleteContainerAction,
  DuplicateLabwareAction,
  SwapSlotContentsAction,
} from '../../labware-ingred/actions'
import type { ReplaceCustomLabwareDef } from '../../labware-defs/actions'
import type { FormData, StepIdType } from '../../form-types'
import type {
  FileLabware,
  FilePipette,
  FileModule,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type {
  AddStepAction,
  ChangeFormInputAction,
  ChangeSavedStepFormAction,
  DeleteStepAction,
  PopulateFormAction,
  ReorderStepsAction,
} from '../../steplist/actions'
import type {
  DuplicateStepAction,
  ReorderSelectedStepAction,
} from '../../ui/steps'
import type { StepItemData } from '../../steplist/types'
import type {
  NormalizedPipetteById,
  NormalizedLabware,
  NormalizedLabwareById,
  ModuleEntities,
} from '../types'
import type {
  CreatePipettesAction,
  DeletePipettesAction,
  SubstituteStepFormPipettesAction,
  CreateModuleAction,
  EditModuleAction,
  DeleteModuleAction,
  SaveStepFormAction,
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
        _getPipetteEntitiesRootState(rootState),
        _getLabwareEntitiesRootState(rootState)
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
            _getPipetteEntitiesRootState(rootState),
            _getLabwareEntitiesRootState(rootState)
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
  moduleLocationUpdate: {},
}

export const initialSavedStepFormsState: SavedStepFormState = {
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
  | CreateModuleAction
  | DeleteModuleAction
  | DuplicateStepAction
  | ChangeSavedStepFormAction
  | DuplicateLabwareAction
  | SwapSlotContentsAction
  | ReplaceCustomLabwareDef

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
    case 'CREATE_MODULE': {
      const prevInitialDeckSetupStep =
        savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
      const labwareOccupyingDestination = getDeckItemIdInSlot(
        prevInitialDeckSetupStep.labwareLocationUpdate,
        action.payload.slot
      )
      const moduleId = action.payload.id
      // If module is going into a slot occupied by a labware,
      // move the labware on top of the new module
      const labwareLocationUpdate =
        labwareOccupyingDestination == null
          ? prevInitialDeckSetupStep.labwareLocationUpdate
          : {
              ...prevInitialDeckSetupStep.labwareLocationUpdate,
              [labwareOccupyingDestination]: moduleId,
            }

      return mapValues(savedStepForms, (savedForm: FormData, formId) => {
        if (formId === INITIAL_DECK_SETUP_STEP_ID) {
          return {
            ...prevInitialDeckSetupStep,
            labwareLocationUpdate,
            moduleLocationUpdate: {
              ...prevInitialDeckSetupStep.moduleLocationUpdate,
              [action.payload.id]: action.payload.slot,
            },
          }
        }

        // NOTE: since users can only have 1 magnetic module at a time,
        // and since the Magnet step form doesn't allow users to select a dropdown,
        // we auto-select a newly-added magnetic module for all of them
        // to handle the case where users delete and re-add a magnetic module
        if (
          savedForm.stepType === 'magnet' &&
          action.payload.type === MAGNETIC_MODULE_TYPE
        ) {
          return { ...savedForm, moduleId }
        }

        return savedForm
      })
    }
    case 'MOVE_DECK_ITEM': {
      const { sourceSlot, destSlot } = action.payload
      return mapValues(savedStepForms, (savedForm: FormData) => {
        if (savedForm.stepType === 'manualIntervention') {
          // swap labware slots from all manualIntervention steps
          const sourceLabwareId = getDeckItemIdInSlot(
            savedForm.labwareLocationUpdate,
            sourceSlot
          )
          const destLabwareId = getDeckItemIdInSlot(
            savedForm.labwareLocationUpdate,
            destSlot
          )

          const sourceModuleId = getDeckItemIdInSlot(
            savedForm.moduleLocationUpdate,
            sourceSlot
          )
          const destModuleId = getDeckItemIdInSlot(
            savedForm.moduleLocationUpdate,
            destSlot
          )

          return {
            ...savedForm,
            labwareLocationUpdate: {
              ...savedForm.labwareLocationUpdate,
              ...(sourceLabwareId ? { [sourceLabwareId]: destSlot } : {}),
              ...(destLabwareId ? { [destLabwareId]: sourceSlot } : {}),
            },
            moduleLocationUpdate: {
              ...savedForm.moduleLocationUpdate,
              ...(sourceModuleId ? { [sourceModuleId]: destSlot } : {}),
              ...(destModuleId ? { [destModuleId]: sourceSlot } : {}),
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
                  _getPipetteEntitiesRootState(rootState),
                  _getLabwareEntitiesRootState(rootState)
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
              _getPipetteEntitiesRootState(rootState),
              _getLabwareEntitiesRootState(rootState)
            ),
          }
        }
        return form
      })
    }
    case 'DELETE_MODULE': {
      const moduleId = action.payload.id
      return mapValues(savedStepForms, (form: FormData) => {
        if (form.stepType === 'manualIntervention') {
          // TODO: Ian 2019-10-28 when we have multiple manualIntervention steps, this should look backwards
          // for the latest location update for the module, not just the initial deck setup
          const _deletedModuleSlot =
            savedStepForms[INITIAL_DECK_SETUP_STEP_ID].moduleLocationUpdate[
              moduleId
            ]
          // handle special spanning slots that are intended for modules & not for labware
          const labwareFallbackSlot =
            _deletedModuleSlot === SPAN7_8_10_11_SLOT ? '7' : _deletedModuleSlot
          return {
            ...form,
            moduleLocationUpdate: omit(form.moduleLocationUpdate, moduleId),
            labwareLocationUpdate: mapValues(
              form.labwareLocationUpdate,
              labwareSlot =>
                labwareSlot === moduleId ? labwareFallbackSlot : labwareSlot
            ),
          }
        } else if (
          (form.stepType === 'magnet' ||
            form.stepType === 'temperature' ||
            form.stepType === 'pause') &&
          form.moduleId === moduleId
        ) {
          return { ...form, moduleId: null }
        } else {
          return form
        }
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
          _getPipetteEntitiesRootState(rootState),
          _getLabwareEntitiesRootState(rootState)
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
            _getPipetteEntitiesRootState(rootState),
            _getLabwareEntitiesRootState(rootState)
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
    case 'REPLACE_CUSTOM_LABWARE_DEF': {
      // no mismatch, it's safe to keep all steps as they are
      if (!action.payload.isOverwriteMismatched) return savedStepForms

      // Reset all well-selection fields of any steps, where the labware of those selected wells is having its def replaced
      // (otherwise, a mismatched definition with different wells or different multi-channel arrangement can break the step forms)
      const stepIds = Object.keys(savedStepForms)
      const labwareEntities = _getLabwareEntitiesRootState(rootState)
      const labwareIdsToDeselect = Object.keys(labwareEntities).filter(
        labwareId =>
          labwareEntities[labwareId].labwareDefURI ===
          action.payload.defURIToOverwrite
      )

      const savedStepsUpdate = stepIds.reduce((acc, stepId) => {
        const prevStepForm = savedStepForms[stepId]
        const defaults = getDefaultsForStepType(prevStepForm.stepType)

        if (!prevStepForm) {
          assert(false, `expected stepForm for id ${stepId}`)
          return acc
        }

        let fieldsToUpdate = {}
        if (prevStepForm.stepType === 'moveLiquid') {
          if (labwareIdsToDeselect.includes(prevStepForm.aspirate_labware)) {
            fieldsToUpdate = {
              ...fieldsToUpdate,
              aspirate_wells: defaults.aspirate_wells,
            }
          }
          if (labwareIdsToDeselect.includes(prevStepForm.dispense_labware)) {
            fieldsToUpdate = {
              ...fieldsToUpdate,
              dispense_wells: defaults.dispense_wells,
            }
          }
        } else if (
          prevStepForm.stepType === 'mix' &&
          labwareIdsToDeselect.includes(prevStepForm.labware)
        ) {
          fieldsToUpdate = {
            wells: defaults.wells,
          }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
          return acc
        }

        const updatedFields = handleFormChange(
          fieldsToUpdate,
          prevStepForm,
          _getPipetteEntitiesRootState(rootState),
          _getLabwareEntitiesRootState(rootState)
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

    default:
      return savedStepForms
  }
}

const initialLabwareState: NormalizedLabwareById = {
  [FIXED_TRASH_ID]: {
    labwareDefURI: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
  },
}

// MIGRATION NOTE: copied from `containers` reducer. Slot + UI stuff stripped out.
export const labwareInvariantProperties = handleActions<
  NormalizedLabwareById,
  *
>(
  {
    CREATE_CONTAINER: (
      state: NormalizedLabwareById,
      action: CreateContainerAction
    ) => {
      return {
        ...state,
        [action.payload.id]: { labwareDefURI: action.payload.labwareDefURI },
      }
    },
    DUPLICATE_LABWARE: (
      state: NormalizedLabwareById,
      action: DuplicateLabwareAction
    ) => {
      return {
        ...state,
        [action.payload.duplicateLabwareId]: {
          labwareDefURI: state[action.payload.templateLabwareId].labwareDefURI,
        },
      }
    },
    DELETE_CONTAINER: (
      state: NormalizedLabwareById,
      action: DeleteContainerAction
    ): NormalizedLabwareById => {
      return omit(state, action.payload.labwareId)
    },
    LOAD_FILE: (
      state: NormalizedLabwareById,
      action: LoadFileAction
    ): NormalizedLabwareById => {
      const { file } = action.payload
      return mapValues(
        file.labware,
        (fileLabware: FileLabware, id: string) => ({
          labwareDefURI: fileLabware.definitionId,
        })
      )
    },
    REPLACE_CUSTOM_LABWARE_DEF: (
      state: NormalizedLabwareById,
      action: ReplaceCustomLabwareDef
    ): NormalizedLabwareById =>
      mapValues(state, (prev: NormalizedLabware): NormalizedLabware =>
        action.payload.defURIToOverwrite === prev.labwareDefURI
          ? {
              ...prev,
              labwareDefURI: getLabwareDefURI(action.payload.newDef),
            }
          : prev
      ),
  },
  initialLabwareState
)

export const moduleInvariantProperties = handleActions<ModuleEntities, *>(
  {
    CREATE_MODULE: (
      state: ModuleEntities,
      action: CreateModuleAction
    ): ModuleEntities => ({
      ...state,
      [action.payload.id]: {
        id: action.payload.id,
        type: action.payload.type,
        model: action.payload.model,
      },
    }),
    EDIT_MODULE: (
      state: ModuleEntities,
      action: EditModuleAction
    ): ModuleEntities => ({
      ...state,
      [action.payload.id]: {
        ...state[action.payload.id],
        model: action.payload.model,
      },
    }),
    DELETE_MODULE: (
      state: ModuleEntities,
      action: DeleteModuleAction
    ): ModuleEntities => omit(state, action.payload.id),
    LOAD_FILE: (
      state: ModuleEntities,
      action: LoadFileAction
    ): ModuleEntities => {
      const { file } = action.payload
      return mapValues(
        file.modules || {}, // TODO: Ian 2019-11-11 this fallback to empty object is for JSONv3 protocols. Once JSONv4 is released, this should be handled in migration in PD
        (fileModule: FileModule, id: string) => ({
          id,
          type: getModuleTypeFromModuleModel(fileModule.model),
          model: fileModule.model,
        })
      )
    },
  },
  {}
)

const initialPipetteState = {}

export const pipetteInvariantProperties = handleActions<
  NormalizedPipetteById,
  *
>(
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
          const tiprackDefURI = metadata.pipetteTiprackAssignments[pipetteId]
          assert(
            tiprackDefURI,
            `expected tiprackDefURI in file metadata for pipette ${pipetteId}`
          )
          return {
            id: pipetteId,
            name: filePipette.name,
            tiprackDefURI,
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
export const orderedStepIds = handleActions<OrderedStepIdsState, *>(
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
export const legacySteps = handleActions<LegacyStepsState, *>(
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
  labwareInvariantProperties: NormalizedLabwareById,
  pipetteInvariantProperties: NormalizedPipetteById,
  moduleInvariantProperties: ModuleEntities,
  legacySteps: LegacyStepsState,
  savedStepForms: SavedStepFormState,
  unsavedForm: FormState,
}

// TODO Ian 2018-12-13: find some existing util to do this
// semi-nested version of combineReducers?
// TODO: Ian 2018-12-13 remove this 'action: any' type
export const rootReducer = (state: RootState, action: any) => {
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
    moduleInvariantProperties: moduleInvariantProperties(
      prevStateFallback.moduleInvariantProperties,
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
