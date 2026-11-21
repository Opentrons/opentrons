import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import reduce from 'lodash/reduce'
import { handleActions } from 'redux-actions'

import {
  FLEX_SIMPLEST_DECK_CONFIG,
  FLEX_STACKER_MODULE_TYPE,
  getAllDefinitions,
  getLabwareDefaultEngageHeight,
  getLabwareDefURI,
  getModuleType,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { GRIPPER_LOCATION } from '@opentrons/step-generation'

import {
  convertStepArrayToHierarchy,
  findStep,
  getPairedSteps,
  isConcurrentGroup,
} from '/protocol-designer/steplist/utils/stepHierarchy'

import {
  INITIAL_DECK_SETUP_STEP_ID,
  PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE,
  PAUSE_UNTIL_VACUUM_STATE_COMPLETE,
} from '../../constants'
import { getPDMetadata } from '../../file-types'
import {
  getOnlyLatestDefs,
  rootReducer as labwareDefsRootReducer,
} from '../../labware-defs'
import {
  getMigratedLabwareId,
  getMigratedURI,
} from '../../labware-ingred/utils'
import {
  getDefaultsForStepType,
  handleFormChange,
} from '../../steplist/formLevel'
import { PRESAVED_STEP_ID } from '../../steplist/types'
import { getLabwareOnModule } from '../../ui/modules/utils'
import {
  getAdditionalEquipmentPythonName,
  getLabwarePythonName,
  getModulePythonName,
} from '../../utils'
import { getLabwareIsCompatible } from '../../utils/labwareModuleCompatibility'
import {
  _getAdditionalEquipmentEntitiesRootState,
  _getInitialDeckSetupRootState,
  _getLabwareEntitiesRootState,
  _getPipetteEntitiesRootState,
} from '../selectors'
import {
  createPresavedStepForm,
  getDeckItemIdInSlot,
  getIdsInRange,
} from '../utils'
import { findAndSplice } from '../utils/findAndSplice'
import { getIsVacuumProfileForm } from '../utils/getIsVacuumProfileForm'
import { getIsVacuumStateWithDurationForm } from '../utils/getIsVacuumStateWithDurationForm'
import { getThermocyclerFormType } from '../utils/getThermocyclerFormType'
import { nestedCombineReducers } from './nestedCombineReducers'

import type { Reducer } from 'redux'
import type { Action as ReduxActionsAction } from 'redux-actions'
import type { PipetteName } from '@opentrons/shared-data'
import type {
  NormalizedAdditionalEquipmentById,
  NormalizedPipetteById,
} from '@opentrons/step-generation'
import type { PipetteLoadInfo } from '../../file-types'
import type { FormData, StepIdType, StepType } from '../../form-types'
import type { RootState as LabwareDefsRootState } from '../../labware-defs'
import type { ReplaceCustomLabwareDef } from '../../labware-defs/actions'
import type {
  CreateContainerAction,
  DeleteContainerAction,
  DuplicateLabwareAction,
  EditMultipleLabwareAction,
  RenameStepAction,
  SwapSlotContentsAction,
} from '../../labware-ingred/actions'
import type { LoadFileAction } from '../../load-file'
import type {
  AdditionalEquipmentLocationUpdate,
  LocationUpdate,
} from '../../load-file/migration/utils/getAdditionalEquipmentLocationUpdate'
import type { EditMultipleModulesAction } from '../../modules'
import type {
  CancelStepFormAction,
  ChangeFormInputAction,
  ChangeSavedStepFormAction,
  DeleteMultipleStepsAction,
  FormPatch,
  PopulateFormAction,
  ReorderStepsAction,
} from '../../steplist/actions'
import type { Action } from '../../types'
import type { SaveStepFormAction } from '../../ui/steps/actions/thunks'
import type {
  AddStepAction,
  DuplicateSelectedStepsAction,
  SelectMultipleStepsAction,
  SelectStepAction,
  SelectTerminalItemAction,
} from '../../ui/steps/actions/types'
import type {
  ChangeBatchEditFieldAction,
  CreateModuleAction,
  CreatePipettesAction,
  DeckConfigurationState,
  DeleteModuleAction,
  DeletePipettesAction,
  ResetBatchEditFieldChangesAction,
  SaveStepFormsMultiAction,
  StackerLabwareCreationFinishAction,
  StackerLabwareCreationStartAction,
  SubstituteStepFormPipettesAction,
  UpdateStackerModuleStateAction,
} from '../actions'
import type {
  CreateDeckFixtureAction,
  DeleteDeckFixtureAction,
  ToggleIsGripperRequiredAction,
} from '../actions/additionalItems'
import type {
  ModuleEntities,
  NormalizedLabware,
  NormalizedLabwareById,
} from '../types'

type FormState = FormData | null
const unsavedFormInitialState = null
// the `unsavedForm` state holds temporary form info that is saved or thrown away with "cancel".
export type UnsavedFormActions =
  | AddStepAction
  | ChangeFormInputAction
  | PopulateFormAction
  | CancelStepFormAction
  | SaveStepFormAction
  | DeleteMultipleStepsAction
  | CreateModuleAction
  | DeleteModuleAction
  | SelectTerminalItemAction
  | SubstituteStepFormPipettesAction
  | SelectMultipleStepsAction
  | ToggleIsGripperRequiredAction
  | CreateDeckFixtureAction
  | DeleteDeckFixtureAction
  | RenameStepAction
export const unsavedForm = (
  rootState: RootState,
  action: UnsavedFormActions
): FormState => {
  const unsavedFormState = rootState
    ? rootState.unsavedForm
    : unsavedFormInitialState

  switch (action.type) {
    case 'ADD_STEP': {
      return createPresavedStepForm({
        stepType: action.payload.stepType,
        stepId: action.payload.id,
        pipetteEntities: _getPipetteEntitiesRootState(rootState),
        labwareEntities: _getLabwareEntitiesRootState(rootState),
        savedStepForms: rootState.savedStepForms,
        orderedStepIds: rootState.orderedStepIds,
        initialDeckSetup: _getInitialDeckSetupRootState(rootState),
        robotStateTimeline: action.meta.robotStateTimeline,
        additionalEquipmentEntities:
          _getAdditionalEquipmentEntitiesRootState(rootState),
      })
    }

    case 'CHANGE_FORM_INPUT': {
      const fieldUpdate = handleFormChange(
        action.payload.update,
        unsavedFormState,
        _getPipetteEntitiesRootState(rootState),
        _getLabwareEntitiesRootState(rootState)
      )
      // @ts-expect-error (IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
      return { ...unsavedFormState, ...fieldUpdate }
    }

    case 'CHANGE_STEP_DETAILS': {
      const fieldUpdate = handleFormChange(
        action.payload.update,
        unsavedFormState,
        _getPipetteEntitiesRootState(rootState),
        _getLabwareEntitiesRootState(rootState)
      )
      // @ts-expect-error (IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
      return { ...unsavedFormState, ...fieldUpdate }
    }

    case 'POPULATE_FORM':
      return action.payload

    case 'CANCEL_STEP_FORM':
    case 'CREATE_MODULE':
    case 'DELETE_MODULE':
    case 'TOGGLE_IS_GRIPPER_REQUIRED':
    case 'CREATE_DECK_FIXTURE':
    case 'DELETE_DECK_FIXTURE':
    case 'DELETE_MULTIPLE_STEPS':
    case 'SELECT_MULTIPLE_STEPS':
    case 'SAVE_STEP_FORM':
    case 'SELECT_TERMINAL_ITEM':
      return unsavedFormInitialState

    case 'SUBSTITUTE_STEP_FORM_PIPETTES': {
      // only substitute unsaved step form if its ID is in the start-end range
      const { substitutionMap, startStepId, endStepId, newTiprackURI } =
        action.payload
      const stepIdsToUpdate = getIdsInRange(
        rootState.orderedStepIds,
        startStepId,
        endStepId
      )

      if (
        unsavedFormState &&
        unsavedFormState?.pipette && // TODO(IL, 2020-06-02): Flow should know unsavedFormState is not null here (so keys are safe to access), but it's being dumb
        unsavedFormState.pipette in substitutionMap &&
        unsavedFormState.id &&
        stepIdsToUpdate.includes(unsavedFormState.id)
      ) {
        // TODO(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
        return {
          ...unsavedFormState,
          ...handleFormChange(
            {
              pipette: substitutionMap[unsavedFormState.pipette],
              tipRack: newTiprackURI,
            },
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
export type SavedStepFormState = Record<StepIdType, FormData>
export const initialDeckSetupStepForm: FormData = {
  stepType: 'manualIntervention',
  id: INITIAL_DECK_SETUP_STEP_ID,
  labwareLocationUpdate: {},
  pipetteLocationUpdate: {},
  moduleLocationUpdate: {},
  moduleStateUpdate: {},
  trashBinLocationUpdate: {},
  wasteChuteLocationUpdate: {},
  stagingAreaLocationUpdate: {},
  gripperLocationUpdate: {},
}
export const initialSavedStepFormsState: SavedStepFormState = {
  [INITIAL_DECK_SETUP_STEP_ID]: initialDeckSetupStepForm,
}
export type SavedStepFormsActions =
  | SaveStepFormAction
  | SaveStepFormsMultiAction
  | DeleteMultipleStepsAction
  | LoadFileAction
  | CreateContainerAction
  | DeleteContainerAction
  | SubstituteStepFormPipettesAction
  | DeletePipettesAction
  | CreateModuleAction
  | DeleteModuleAction
  | UpdateStackerModuleStateAction
  | DuplicateSelectedStepsAction
  | ChangeSavedStepFormAction
  | DuplicateLabwareAction
  | SwapSlotContentsAction
  | ReplaceCustomLabwareDef
  | ToggleIsGripperRequiredAction
  | CreateDeckFixtureAction
  | DeleteDeckFixtureAction
export const _editModuleFormUpdate = ({
  savedForm,
  moduleId,
  formId,
  rootState,
  nextModuleModel,
}: {
  savedForm: FormData
  moduleId: string
  formId: string
  rootState: RootState
  nextModuleModel: string
}): FormData => {
  if (
    savedForm.stepType === 'magnet' &&
    savedForm.moduleId === moduleId &&
    savedForm.magnetAction === 'engage'
  ) {
    const prevEngageHeight = parseFloat(savedForm.engageHeight as string)

    if (Number.isFinite(prevEngageHeight)) {
      const initialDeckSetup = _getInitialDeckSetupRootState(rootState)

      const labwareEntity = getLabwareOnModule(initialDeckSetup, moduleId)
      const labwareDefaultEngageHeight = labwareEntity
        ? getLabwareDefaultEngageHeight(labwareEntity.def)
        : null
      const moduleEntity = initialDeckSetup.modules[moduleId]
      console.assert(
        moduleEntity != null,
        `editModuleFormUpdate expected moduleEntity for module ${moduleId}`
      )
      const prevModuleModel = moduleEntity?.model

      if (labwareDefaultEngageHeight != null) {
        // compensate for fact that V1 mag module uses 'short mm'
        const shortMMDefault = labwareDefaultEngageHeight * 2
        const prevModelSpecificDefault =
          prevModuleModel === MAGNETIC_MODULE_V1
            ? shortMMDefault
            : labwareDefaultEngageHeight
        const nextModelSpecificDefault =
          nextModuleModel === MAGNETIC_MODULE_V1
            ? shortMMDefault
            : labwareDefaultEngageHeight

        if (prevEngageHeight === prevModelSpecificDefault) {
          return {
            ...savedForm,
            engageHeight: String(nextModelSpecificDefault),
          }
        }
      }
    }

    // default case: null out engageHeight if magnet step's module has been edited
    const blankEngageHeight = getDefaultsForStepType('magnet').engageHeight
    return { ...savedForm, engageHeight: blankEngageHeight }
  }

  // not a Magnet > Engage step for the edited moduleId, no change
  return savedForm
}
export const savedStepForms = (
  rootState: RootState,
  action: SavedStepFormsActions
): SavedStepFormState => {
  const savedStepForms = rootState
    ? rootState.savedStepForms
    : initialSavedStepFormsState

  switch (action.type) {
    case 'SAVE_STEP_FORM': {
      const { newStepFormsById } = saveStepFormHelper({
        action,
        originalOrderedStepIds: rootState.orderedStepIds,
        originalStepFormsById: savedStepForms,
      })
      return newStepFormsById
    }

    case 'SAVE_STEP_FORMS_MULTI': {
      const { editedFields, stepIds } = action.payload
      return stepIds.reduce(
        (acc, stepId) => ({
          ...acc,
          [stepId]: { ...savedStepForms[stepId], ...editedFields },
        }),
        { ...savedStepForms }
      )
    }

    case 'DELETE_MULTIPLE_STEPS': {
      return omit(savedStepForms, action.payload)
    }

    case 'LOAD_FILE': {
      const { file } = action.payload
      const metadata = getPDMetadata(file)
      const { savedStepForms: stepFormsFromFile, labware } = metadata
      const prevInitialDeckSetupStep =
        stepFormsFromFile[INITIAL_DECK_SETUP_STEP_ID]
      const formLabwareLocationUpdate: Record<string, string> =
        prevInitialDeckSetupStep.labwareLocationUpdate
      const allLabware = getAllDefinitions()
      const latestDefs = getOnlyLatestDefs()
      const updatedLabwareLocationUpdate = Object.entries(
        formLabwareLocationUpdate
      ).reduce((acc: Record<string, string>, [id, location]) => {
        const updatedLabwareId = getMigratedLabwareId(
          id,
          labware,
          allLabware,
          latestDefs
        )
        if (updatedLabwareId == null) {
          return acc
        }
        // The `location` can be a labwareId too, so update its version as well.
        // (We only recently realized that we need to update `location`, so there are
        // probably saved protocols out there where we hadn't updated `location` and
        // it refers to a labwareId that doesn't exist in metadata.labware.)
        const [locationUUID, locationDefURI] = location.split(':')
        const updatedLocation =
          locationDefURI && locationDefURI in allLabware
            ? `${locationUUID}:${getMigratedURI(locationDefURI, allLabware, latestDefs)}`
            : location
        acc[updatedLabwareId] = updatedLocation
        return acc
      }, {})

      return mapValues(stepFormsFromFile, (stepForm: FormData, formId) => {
        if (formId === INITIAL_DECK_SETUP_STEP_ID) {
          return {
            ...prevInitialDeckSetupStep,
            labwareLocationUpdate: {
              ...updatedLabwareLocationUpdate,
            },
          }
        } else if (
          stepForm.stepType === 'mix' ||
          stepForm.stepType === 'moveLabware'
        ) {
          return {
            ...getDefaultsForStepType(stepForm.stepType),
            ...stepForm,
            labware: getMigratedLabwareId(
              stepForm.labware as string,
              labware,
              allLabware,
              latestDefs
            ),
            tipRack:
              stepForm.stepType === 'mix'
                ? getMigratedURI(
                    stepForm.tipRack as string,
                    allLabware,
                    latestDefs
                  )
                : undefined,
          }
        } else if (stepForm.stepType === 'moveLiquid') {
          return {
            ...getDefaultsForStepType(stepForm.stepType),
            ...stepForm,
            aspirate_labware: getMigratedLabwareId(
              stepForm.aspirate_labware as string,
              labware,
              allLabware,
              latestDefs
            ),
            dispense_labware: getMigratedLabwareId(
              stepForm.dispense_labware as string,
              labware,
              allLabware,
              latestDefs
            ),
            tipRack: getMigratedURI(
              stepForm.tipRack as string,
              allLabware,
              latestDefs
            ),
          }
        }
        return {
          ...getDefaultsForStepType(stepForm.stepType),
          ...stepForm,
        }
      })
    }
    case 'CREATE_DECK_FIXTURE': {
      const { id, location, name } = action.payload
      const prevInitialDeckSetupStep =
        savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
      const locationUpdate = `${name}LocationUpdate`
      return mapValues(savedStepForms, (savedForm: FormData, formId) => {
        if (formId === INITIAL_DECK_SETUP_STEP_ID) {
          return {
            ...prevInitialDeckSetupStep,
            [locationUpdate]: {
              ...prevInitialDeckSetupStep[locationUpdate],
              [id]: location,
            },
          }
        } else if (
          (locationUpdate[savedForm.dropTip_location] == null ||
            savedForm.dropTip_location == null) &&
          (name === 'trashBin' || name === 'wasteChute')
        ) {
          return {
            ...savedForm,
            ...handleFormChange(
              {
                dropTip_location: id,
              },
              savedForm,
              _getPipetteEntitiesRootState(rootState),
              _getLabwareEntitiesRootState(rootState)
            ),
          }
        }
        return savedForm
      })
    }
    case 'DELETE_DECK_FIXTURE': {
      const { id } = action.payload
      const name = id.split(':')[1]
      const locationUpdate = `${name}LocationUpdate`

      return mapValues(savedStepForms, (form: FormData): FormData => {
        if (form.stepType === 'manualIntervention') {
          const updatedLocation = omit(form[locationUpdate] || {}, id)

          return {
            ...form,
            [locationUpdate]:
              Object.keys(updatedLocation).length > 0 ? updatedLocation : {},
          }
        } else if (id.includes(form.dropTip_location as string)) {
          return {
            ...form,
            ...handleFormChange(
              {
                dropTip_location: null,
              },
              form,
              _getPipetteEntitiesRootState(rootState),
              _getLabwareEntitiesRootState(rootState)
            ),
          }
        } else if (id.includes(form.newLocation as string)) {
          return {
            ...form,
            ...handleFormChange(
              {
                newLocation: null,
              },
              form,
              _getPipetteEntitiesRootState(rootState),
              _getLabwareEntitiesRootState(rootState)
            ),
          }
        }

        return form
      })
    }
    case 'TOGGLE_IS_GRIPPER_REQUIRED': {
      const { id } = action.payload
      const prevInitialDeckSetupStep =
        savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
      const gripperLocationUpdate: LocationUpdate =
        prevInitialDeckSetupStep.gripperLocationUpdate
      const gripperKey = Object.entries(gripperLocationUpdate).find(
        ([_, value]) => value === GRIPPER_LOCATION
      )?.[0]

      if (gripperKey == null) {
        return {
          ...savedStepForms,
          [INITIAL_DECK_SETUP_STEP_ID]: {
            ...prevInitialDeckSetupStep,
            gripperLocationUpdate: {
              ...gripperLocationUpdate,
              [id]: GRIPPER_LOCATION,
            },
          },
        }
      } else {
        return {
          ...savedStepForms,
          [INITIAL_DECK_SETUP_STEP_ID]: {
            ...prevInitialDeckSetupStep,
            gripperLocationUpdate: {},
          },
        }
      }
    }
    case 'DUPLICATE_LABWARE':
    case 'CREATE_CONTAINER': {
      // auto-update initial deck setup state.
      const prevInitialDeckSetupStep =
        savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
      const labwareId: string =
        action.type === 'CREATE_CONTAINER'
          ? action.payload.id
          : action.payload.duplicateLabwareId
      console.assert(
        prevInitialDeckSetupStep != null,
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
        prevInitialDeckSetupStep.labwareLocationUpdate as Record<
          string,
          string
        >,
        action.payload.slot
      )
      const moduleId = action.payload.id
      // If module is going into a slot occupied by a labware,
      // move the labware on top of the new module
      const labwareLocationUpdate: Record<string, string> =
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

        // same logic applies to Thermocycler
        if (
          savedForm.stepType === 'thermocycler' &&
          action.payload.type === THERMOCYCLER_MODULE_TYPE
        ) {
          return { ...savedForm, moduleId }
        }

        return savedForm
      })
    }

    case 'UPDATE_STACKER_MODULE_STATE': {
      const prevInitialDeckSetupStep =
        savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
      return mapValues(savedStepForms, (savedForm: FormData, formId) => {
        if (formId === INITIAL_DECK_SETUP_STEP_ID) {
          return {
            ...prevInitialDeckSetupStep,
            moduleStateUpdate: {
              ...(prevInitialDeckSetupStep.moduleStateUpdate || {}),
              [action.payload.moduleId]: action.payload.moduleState,
            },
          }
        }
        return savedForm
      })
    }

    case 'MOVE_DECK_ITEM': {
      const { sourceSlot, destSlot } = action.payload
      return mapValues(savedStepForms, (savedForm: FormData): FormData => {
        if (savedForm.stepType === 'manualIntervention') {
          // swap labware/module slots from all manualIntervention steps
          // (or place compatible labware in dest slot onto module)
          const sourceLabwareId = getDeckItemIdInSlot(
            savedForm.labwareLocationUpdate as Record<string, string>,
            sourceSlot
          )
          const destLabwareId = getDeckItemIdInSlot(
            savedForm.labwareLocationUpdate as Record<string, string>,
            destSlot
          )
          const sourceModuleId = getDeckItemIdInSlot(
            savedForm.moduleLocationUpdate as Record<string, string>,
            sourceSlot
          )
          const destModuleId = getDeckItemIdInSlot(
            savedForm.moduleLocationUpdate as Record<string, string>,
            destSlot
          )

          if (sourceModuleId && destLabwareId) {
            // moving module to a destination slot with labware
            const prevInitialDeckSetup =
              _getInitialDeckSetupRootState(rootState)

            const moduleEntity = prevInitialDeckSetup.modules[sourceModuleId]
            const labwareEntity = prevInitialDeckSetup.labware[destLabwareId]
            const isCompat = getLabwareIsCompatible(
              labwareEntity.def,
              moduleEntity.type
            )
            const moduleIsOccupied =
              getDeckItemIdInSlot(
                savedForm.labwareLocationUpdate as Record<string, string>,
                sourceModuleId
              ) != null

            if (
              isCompat &&
              !moduleIsOccupied &&
              moduleEntity.type !== FLEX_STACKER_MODULE_TYPE
            ) {
              // only in this special case, we put module under the labware
              return {
                ...savedForm,
                labwareLocationUpdate: {
                  ...savedForm.labwareLocationUpdate,
                  [destLabwareId]: sourceModuleId,
                },
                moduleLocationUpdate: {
                  ...savedForm.moduleLocationUpdate,
                  [sourceModuleId]: destSlot,
                },
              }
            }
          }

          const labwareLocationUpdate: Record<string, string> = {
            ...savedForm.labwareLocationUpdate,
          }

          if (sourceLabwareId != null) {
            labwareLocationUpdate[sourceLabwareId] = destSlot
          }

          if (destLabwareId != null) {
            labwareLocationUpdate[destLabwareId] = sourceSlot
          }

          const moduleLocationUpdate: Record<string, string> = {
            ...savedForm.moduleLocationUpdate,
          }

          if (sourceModuleId != null) {
            moduleLocationUpdate[sourceModuleId] = destSlot
          }

          if (destModuleId != null) {
            moduleLocationUpdate[destModuleId] = sourceSlot
          }

          return { ...savedForm, labwareLocationUpdate, moduleLocationUpdate }
        }

        return savedForm
      })
    }

    case 'DELETE_CONTAINER': {
      const labwareIdToDelete = action.payload.labwareId
      return mapValues(savedStepForms, (savedForm: FormData) => {
        if (savedForm.stepType === 'manualIntervention') {
          // remove instances of labware from all manualIntervention steps
          const updatedLabwareLocation = Object.entries(
            savedForm.labwareLocationUpdate as Record<string, string>
          ).reduce((acc: Record<string, string>, [labwareId, location]) => {
            if (labwareId === labwareIdToDelete) {
              return acc
            }

            // If labware is on an adapter and adapter was deleted, update labwareId's location
            const newLocationId =
              location === labwareIdToDelete
                ? savedForm.labwareLocationUpdate[labwareIdToDelete]
                : location

            acc[labwareId] = newLocationId
            return acc
          }, {})

          return {
            ...savedForm,
            labwareLocationUpdate: updatedLabwareLocation,
          }
        } else if (
          savedForm.stepType === 'moveLabware' &&
          savedForm.labware === labwareIdToDelete
        ) {
          return {
            ...savedForm,
            labware: null,
          }
        }

        const deleteLabwareUpdate = reduce<FormData, FormData>(
          savedForm,
          (acc, value, fieldName) => {
            if (value === labwareIdToDelete) {
              // TODO(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
              return {
                ...acc,
                ...handleFormChange(
                  {
                    [fieldName]: null,
                  },
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
        // TODO(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
        return { ...savedForm, ...deleteLabwareUpdate }
      })
    }
    case 'DELETE_PIPETTES': {
      // remove references to pipettes that have been deleted
      const deletedPipetteIds = action.payload
      return mapValues(savedStepForms, (form: FormData): FormData => {
        if (form.stepType === 'manualIntervention') {
          return {
            ...form,
            pipetteLocationUpdate: omit(
              form.pipetteLocationUpdate,
              deletedPipetteIds
            ),
          }
        } else if (deletedPipetteIds.includes(form.pipette as string)) {
          // TODO(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
          return {
            ...form,
            ...handleFormChange(
              {
                pipette: null,
                tipRack: null,
              },
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
          const deletedModuleSlot =
            savedStepForms[INITIAL_DECK_SETUP_STEP_ID].moduleLocationUpdate[
              moduleId
            ]
          return {
            ...form,
            moduleLocationUpdate: omit(form.moduleLocationUpdate, moduleId),
            labwareLocationUpdate: mapValues(
              form.labwareLocationUpdate,
              labwareSlot =>
                labwareSlot === moduleId ? deletedModuleSlot : labwareSlot
            ),
          }
        } else if (
          (form.stepType === 'magnet' ||
            form.stepType === 'temperature' ||
            form.stepType === 'heaterShaker' ||
            form.stepType === 'absorbanceReader' ||
            form.stepType === 'thermocycler' ||
            form.stepType === 'flexStacker' ||
            form.stepType === 'pause' ||
            form.stepType === 'vacuum') &&
          form.moduleId === moduleId
        ) {
          return { ...form, moduleId: null }
        } else {
          return form
        }
      })
    }

    case 'SUBSTITUTE_STEP_FORM_PIPETTES': {
      const { startStepId, endStepId, substitutionMap, newTiprackURI } =
        action.payload
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
          {
            pipette: substitutionMap[prevStepForm.pipette],
            tipRack: newTiprackURI,
          },
          prevStepForm,
          _getPipetteEntitiesRootState(rootState),
          _getLabwareEntitiesRootState(rootState)
        )
        return {
          ...acc,
          // TODO(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
          [stepId]: { ...prevStepForm, ...updatedFields },
        }
      }, {})
      // TODO(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
      return { ...savedStepForms, ...savedStepsUpdate }
    }

    case 'CHANGE_SAVED_STEP_FORM': {
      const { stepId } = action.payload

      if (stepId == null) {
        console.assert(
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
        // TODO(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
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

    case 'DUPLICATE_SELECTED_STEPS': {
      return action.payload.steps.reduce(
        (acc, { originalStepId, duplicateStepId }) => ({
          ...acc,
          [duplicateStepId]: {
            ...cloneDeep(savedStepForms[originalStepId]),
            id: duplicateStepId,
          },
        }),
        { ...savedStepForms }
      )
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
      const savedStepsUpdate = stepIds.reduce<SavedStepFormState>(
        (acc, stepId) => {
          const prevStepForm = savedStepForms[stepId]
          const defaults = getDefaultsForStepType(prevStepForm.stepType)

          if (!prevStepForm) {
            console.assert(false, `expected stepForm for id ${stepId}`)
            return acc
          }

          let fieldsToUpdate = {}

          if (prevStepForm.stepType === 'moveLiquid') {
            if (
              labwareIdsToDeselect.includes(
                prevStepForm.aspirate_labware as string
              )
            ) {
              fieldsToUpdate = {
                ...fieldsToUpdate,
                aspirate_wells: defaults.aspirate_wells,
              }
            }

            if (
              labwareIdsToDeselect.includes(
                prevStepForm.dispense_labware as string
              )
            ) {
              fieldsToUpdate = {
                ...fieldsToUpdate,
                dispense_wells: defaults.dispense_wells,
              }
            }
          } else if (
            prevStepForm.stepType === 'mix' &&
            labwareIdsToDeselect.includes(prevStepForm.labware as string)
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
            // TODO(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
            [stepId]: { ...prevStepForm, ...updatedFields },
          }
        },
        {}
      )
      return { ...savedStepForms, ...savedStepsUpdate }
    }

    default:
      return savedStepForms
  }
}
export type BatchEditFormChangesState = FormPatch
type BatchEditFormActions =
  | ChangeBatchEditFieldAction
  | ResetBatchEditFieldChangesAction
  | SaveStepFormsMultiAction
  | SelectStepAction
  | SelectMultipleStepsAction
  | DuplicateSelectedStepsAction
  | DeleteMultipleStepsAction
export const batchEditFormChanges = (
  state: BatchEditFormChangesState = {},
  action: BatchEditFormActions
): BatchEditFormChangesState => {
  switch (action.type) {
    case 'CHANGE_BATCH_EDIT_FIELD': {
      return { ...state, ...action.payload }
    }

    case 'SELECT_STEP':
    case 'SAVE_STEP_FORMS_MULTI':
    case 'SELECT_MULTIPLE_STEPS':
    case 'DUPLICATE_SELECTED_STEPS':
    case 'DELETE_MULTIPLE_STEPS':
    case 'RESET_BATCH_EDIT_FIELD_CHANGES': {
      return {}
    }

    default: {
      return state
    }
  }
}

const initialLabwareState: NormalizedLabwareById = {}
// MIGRATION NOTE: copied from `containers` reducer. Slot + UI stuff stripped out.
export const labwareInvariantProperties: Reducer<
  NormalizedLabwareById,
  any
  // @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
  // TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
> = handleActions(
  {
    CREATE_CONTAINER: (
      state: NormalizedLabwareById,
      action: CreateContainerAction
    ) => {
      const { payload } = action
      const { labwareDefURI, id, displayCategory } = payload

      const categoryLength = Object.values(state).filter(
        labware => labware.displayCategory === displayCategory
      ).length

      return {
        ...state,
        [id]: {
          labwareDefURI,
          displayCategory,
          pythonName: `${getLabwarePythonName(
            displayCategory,
            categoryLength + 1
          )}`,
        },
      }
    },
    DUPLICATE_LABWARE: (
      state: NormalizedLabwareById,
      action: DuplicateLabwareAction
    ) => {
      const { payload } = action
      const { duplicateLabwareId, templateLabwareId, displayCategory } = payload

      const categoryLength = Object.values(state).filter(
        labware => labware.displayCategory === displayCategory
      ).length

      return {
        ...state,
        [duplicateLabwareId]: {
          labwareDefURI: state[templateLabwareId].labwareDefURI,
          displayCategory,
          pythonName: `${getLabwarePythonName(
            displayCategory,
            categoryLength + 1
          )}`,
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
      const metadata = getPDMetadata(file)
      const labwareDefinitionsFromFile = file.labwareDefinitions
      const allLabware = getAllDefinitions()
      const latestDefs = getOnlyLatestDefs()
      let labware: NormalizedLabwareById = {}

      labware = Object.entries(metadata.labware).reduce(
        (acc: NormalizedLabwareById, [id, labwareLoadInfo]) => {
          const labwareDefURI = labwareLoadInfo.labwareDefURI

          const definition =
            //  labwareDefinitionsFromFile from file are either customLabware for py
            //  or all labwareDefs for JSON
            labwareDefinitionsFromFile?.[labwareDefURI] ??
            allLabware[labwareDefURI]

          if (definition == null) {
            console.error(
              `Expected to find matching labware definition in the JSON file or Opentrons labware library but could not with labwareDefUri ${labwareDefURI}`
            )
          }

          const loadName = definition.parameters.loadName
          const latestDefURI = Object.entries(latestDefs).find(
            ([_, def]) => def.parameters.loadName === loadName
          )?.[0]

          const displayCategory =
            definition?.metadata.displayCategory ?? 'otherLabware'

          const displayCategoryCount = Object.values(acc).filter(
            lw => lw.displayCategory === displayCategory
          ).length

          const labwareIdString = id.split(':')[0]
          const latestLabwareId =
            latestDefURI != null
              ? `${labwareIdString}:${latestDefURI}`
              : `${labwareIdString}:${labwareDefURI}`

          acc[latestLabwareId] = {
            labwareDefURI: latestDefURI ?? labwareDefURI,
            pythonName: getLabwarePythonName(
              displayCategory,
              displayCategoryCount + 1
            ),
            displayCategory,
          }

          return acc
        },
        {}
      )

      return { ...labware, ...state }
    },
    EDIT_MULTIPLE_LABWARE_PYTHON_NAME: (
      state: NormalizedLabwareById,
      action: EditMultipleLabwareAction
    ): NormalizedLabwareById => {
      return {
        ...state,
        ...action.payload,
      }
    },
    REPLACE_CUSTOM_LABWARE_DEF: (
      state: NormalizedLabwareById,
      action: ReplaceCustomLabwareDef
    ): NormalizedLabwareById => {
      const { payload } = action
      const { newDef, defURIToOverwrite } = payload
      const displayCategory = newDef.metadata.displayCategory
      const categoryLength = Object.values(state).filter(
        labware => labware.displayCategory === displayCategory
      ).length

      const mappedLabware = mapValues(
        state,
        (prev: NormalizedLabware): NormalizedLabware =>
          defURIToOverwrite === prev.labwareDefURI
            ? {
                ...prev,
                labwareDefURI: getLabwareDefURI(newDef),
                pythonName: getLabwarePythonName(
                  displayCategory,
                  categoryLength + 1
                ),
                displayCategory,
              }
            : prev
      )
      return mappedLabware
    },
  },
  initialLabwareState
)
export const moduleInvariantProperties: Reducer<
  ModuleEntities,
  any
  // @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
  // TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
> = handleActions(
  {
    CREATE_MODULE: (
      state: ModuleEntities,
      action: CreateModuleAction
    ): ModuleEntities => {
      const type = action.payload.type
      const typeCount = Object.values(state).filter(
        module => module.type === type
      ).length

      return {
        ...state,
        [action.payload.id]: {
          id: action.payload.id,
          type,
          model: action.payload.model,
          pythonName: getModulePythonName(type, typeCount + 1),
        },
      }
    },
    DELETE_MODULE: (
      state: ModuleEntities,
      action: DeleteModuleAction
    ): ModuleEntities => omit(state, action.payload.id),
    EDIT_MULTIPLE_MODULES_PYTHON_NAME: (
      state: ModuleEntities,
      action: EditMultipleModulesAction
    ): ModuleEntities => {
      return {
        ...state,
        ...action.payload,
      }
    },
    LOAD_FILE: (
      state: ModuleEntities,
      action: LoadFileAction
    ): ModuleEntities => {
      const { file } = action.payload
      const metadata = getPDMetadata(file)
      const modules: ModuleEntities = Object.entries(metadata.modules).reduce(
        (acc: ModuleEntities, [id, moduleLoadInfo]) => {
          const moduleType = getModuleType(moduleLoadInfo.model)
          const typeCount = Object.values(acc).filter(
            module => module.type === moduleType
          ).length

          acc[id] = {
            id,
            type: moduleType,
            model: moduleLoadInfo.model,
            pythonName: getModulePythonName(moduleType, typeCount + 1),
          }

          return acc
        },
        {}
      )

      return Object.keys(modules).length > 0 ? modules : state
    },
  },
  {}
)
const initialPipetteState = {}
export const pipetteInvariantProperties: Reducer<
  NormalizedPipetteById,
  any
  // @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
> = handleActions(
  {
    LOAD_FILE: (
      state: NormalizedPipetteById,
      action: LoadFileAction
    ): NormalizedPipetteById => {
      const { file } = action.payload
      const metadata = getPDMetadata(file)
      const allLabwareDefs = getAllDefinitions()
      const latestDefs = getOnlyLatestDefs()
      const pipettes = Object.entries(metadata.pipettes).reduce(
        (
          acc: NormalizedPipetteById,
          [id, pipetteLoadInfo]: [string, PipetteLoadInfo]
        ) => {
          const tiprackDefURI = metadata.pipetteTiprackAssignments[id] ?? []
          // If the pipette doesn't exist in the metadata.pipetteTiprackAssignments,
          // then the protocol file is malformed, but there's nothing we can do about
          // that, so just assign an empty tiprackDefURI to the pipette in that case.
          const latestTiprackDefURIs = tiprackDefURI.map(uri =>
            getMigratedURI(uri, allLabwareDefs, latestDefs)
          )

          return {
            ...acc,
            [id]: {
              id,
              name: pipetteLoadInfo.pipetteName as PipetteName,
              tiprackDefURI: latestTiprackDefURIs,
            },
          }
        },
        {}
      )
      return Object.keys(pipettes).length > 0 ? pipettes : state
    },
    CREATE_PIPETTES: (
      state: NormalizedPipetteById,
      action: CreatePipettesAction
    ): NormalizedPipetteById => {
      return { ...state, ...action.payload }
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

const initialAdditionalEquipmentState = {}

export const additionalEquipmentInvariantProperties =
  handleActions<NormalizedAdditionalEquipmentById>(
    {
      //  @ts-expect-error
      LOAD_FILE: (
        state,
        action: LoadFileAction
      ): NormalizedAdditionalEquipmentById => {
        const { file } = action.payload
        const savedStepForms = file.designerApplication?.data?.savedStepForms
        const initialDeckSetup: AdditionalEquipmentLocationUpdate =
          savedStepForms?.[INITIAL_DECK_SETUP_STEP_ID] as any
        const {
          gripperLocationUpdate,
          trashBinLocationUpdate,
          wasteChuteLocationUpdate,
          stagingAreaLocationUpdate,
        } = initialDeckSetup

        let gripper
        if (Object.keys(gripperLocationUpdate).length > 0) {
          const id = Object.keys(gripperLocationUpdate)[0]
          gripper = {
            [id]: {
              name: 'gripper' as const,
              id,
              location: GRIPPER_LOCATION,
            },
          }
        }
        let trashBin
        if (Object.keys(trashBinLocationUpdate).length > 0) {
          trashBin = Object.entries(trashBinLocationUpdate).reduce(
            (acc, [id, location], index) => ({
              ...acc,
              [id]: {
                name: 'trashBin' as const,
                id,
                location,
                pythonName: getAdditionalEquipmentPythonName(
                  'trashBin',
                  index + 1,
                  location
                ),
              },
            }),
            {}
          )
        }
        let wasteChute
        if (Object.keys(wasteChuteLocationUpdate).length > 0) {
          const id = Object.keys(wasteChuteLocationUpdate)[0]
          wasteChute = {
            [id]: {
              name: 'wasteChute' as const,
              id,
              location: Object.values(wasteChuteLocationUpdate)[0],
              pythonName: getAdditionalEquipmentPythonName('wasteChute', 1),
            },
          }
        }
        let stagingArea
        if (Object.keys(stagingAreaLocationUpdate).length > 0) {
          stagingArea = Object.entries(stagingAreaLocationUpdate).reduce(
            (acc, [id, location]) => ({
              ...acc,
              [id]: {
                name: 'stagingArea' as const,
                id,
                location,
              },
            }),
            {}
          )
        }

        return {
          ...state,
          ...trashBin,
          ...wasteChute,
          ...gripper,
          ...stagingArea,
        }
      },
      //  @ts-expect-error
      TOGGLE_IS_GRIPPER_REQUIRED: (
        state: NormalizedAdditionalEquipmentById,
        action: ToggleIsGripperRequiredAction
      ): NormalizedAdditionalEquipmentById => {
        let updatedEquipment = { ...state }
        const id = action.payload.id
        const gripperKey = Object.keys(updatedEquipment).find(
          key => updatedEquipment[key].name === 'gripper'
        )

        if (gripperKey != null) {
          updatedEquipment = omit(updatedEquipment, [gripperKey])
        } else {
          updatedEquipment = {
            ...updatedEquipment,
            [id]: {
              name: 'gripper' as const,
              id,
              location: GRIPPER_LOCATION,
            },
          }
        }
        return updatedEquipment
      },
      //  @ts-expect-error
      CREATE_DECK_FIXTURE: (
        state: NormalizedAdditionalEquipmentById,
        action: CreateDeckFixtureAction
      ): NormalizedAdditionalEquipmentById => {
        const { location, id, name } = action.payload
        const typeCount = Object.values(state).filter(
          aE => aE.name === name
        ).length

        return {
          ...state,
          [id]: {
            name,
            id,
            location,
            pythonName:
              name === 'stagingArea'
                ? undefined
                : getAdditionalEquipmentPythonName(
                    name,
                    typeCount + 1,
                    location
                  ),
          },
        }
      },
      //  @ts-expect-error
      DELETE_DECK_FIXTURE: (
        state: NormalizedAdditionalEquipmentById,
        action: DeleteDeckFixtureAction
      ): NormalizedAdditionalEquipmentById => omit(state, action.payload.id),
      DEFAULT: (): NormalizedAdditionalEquipmentById => ({}),
    },
    initialAdditionalEquipmentState
  )
export const ADD_STEPS_TO_GROUP = 'ADD_STEPS_TO_GROUP'
export const CREATE_GROUP = 'CREATE_GROUP'
export const REMOVE_GROUP = 'REMOVE_GROUP'
export type StepGroupsState = Record<string, StepIdType[]>
const initialStepGroupState = {}
const stepGroups: Reducer<StepGroupsState, any> = handleActions<
  StepGroupsState,
  any
>(
  {
    CREATE_GROUP: (state, action) => {
      return {
        ...state,
        [action.payload.groupName]: [],
      }
    },
    REMOVE_GROUP: (state, action) => {
      const { [action.payload.groupName]: removedGroup, ...remainingGroups } =
        state
      return remainingGroups
    },
    ADD_STEPS_TO_GROUP: (state, action) => {
      return {
        ...state,
        [action.payload.groupName]: [
          ...state[action.payload.groupName],
          ...action.payload.stepIds,
        ],
      }
    },
  },
  initialStepGroupState
)
export type UnsavedGroupState = StepIdType[]
export const SELECT_STEP_FOR_UNSAVED_GROUP = 'SELECT_STEP_FOR_UNSAVED_GROUP'
export const CLEAR_UNSAVED_GROUP = 'CLEAR_UNSAVED_GROUP'
const initialUnsavedGroupState: StepIdType[] = []
const unsavedGroup: Reducer<UnsavedGroupState, any> = handleActions<
  UnsavedGroupState,
  any
>(
  {
    SELECT_STEP_FOR_UNSAVED_GROUP: (state, action) => {
      const stepId: string = action.payload.stepId
      if (state.includes(stepId)) {
        return state.filter(id => id !== stepId)
      } else {
        return [...state, stepId]
      }
    },
    CLEAR_UNSAVED_GROUP: () => {
      return []
    },
  },
  initialUnsavedGroupState
)

type OrderedStepIdsActions =
  | SaveStepFormAction
  | DeleteMultipleStepsAction
  | LoadFileAction
  | DuplicateSelectedStepsAction
  | ReorderStepsAction
export type OrderedStepIdsState = StepIdType[]
const initialOrderedStepIdsState: string[] = []
export const orderedStepIds = (
  rootState: RootState,
  action: OrderedStepIdsActions
): OrderedStepIdsState => {
  const orderedStepIds = rootState
    ? rootState.orderedStepIds
    : initialOrderedStepIdsState

  switch (action.type) {
    case 'SAVE_STEP_FORM': {
      const { newOrderedStepIds } = saveStepFormHelper({
        action,
        originalOrderedStepIds: orderedStepIds,
        originalStepFormsById: rootState.savedStepForms,
      })
      return newOrderedStepIds
    }

    case 'DELETE_MULTIPLE_STEPS': {
      return orderedStepIds.filter(id => !action.payload.includes(id))
    }

    case 'LOAD_FILE': {
      return getPDMetadata(action.payload.file).orderedStepIds
    }

    case 'DUPLICATE_SELECTED_STEPS': {
      return action.payload.newStepOrder
    }

    case 'REORDER_STEPS': {
      return action.payload.stepIds
    }

    default: {
      return orderedStepIds
    }
  }
}

const initialDeckConfiguration: DeckConfigurationState = {
  deckConfig: FLEX_SIMPLEST_DECK_CONFIG,
}
const deckConfigurationProperties: Reducer<DeckConfigurationState, any> =
  handleActions<DeckConfigurationState, any>(
    {
      EDIT_DECK_CONFIGURATION: (state, action) => {
        return {
          deckConfig: action.payload.deckConfig,
        }
      },
    },
    initialDeckConfiguration
  )

export type PresavedStepFormState = {
  stepType: StepType
} | null
export type PresavedStepFormAction =
  | AddStepAction
  | CancelStepFormAction
  | DeleteMultipleStepsAction
  | SaveStepFormAction
  | SelectTerminalItemAction
  | SelectStepAction
  | SelectMultipleStepsAction
export const presavedStepForm = (
  state: PresavedStepFormState = null,
  action: PresavedStepFormAction
): PresavedStepFormState => {
  switch (action.type) {
    case 'ADD_STEP':
      return {
        stepType: action.payload.stepType,
      }

    case 'SELECT_TERMINAL_ITEM':
      return action.payload === PRESAVED_STEP_ID ? state : null

    case 'CANCEL_STEP_FORM':
    case 'DELETE_MULTIPLE_STEPS':
    case 'SAVE_STEP_FORM':
    case 'SELECT_STEP':
    case 'SELECT_MULTIPLE_STEPS':
      return null

    default:
      return state
  }
}

// in stackerLabwareSlice.ts (or wherever your stacker state is)
export interface StackerLabwareState {
  pendingCreation: boolean
}

const initialState: StackerLabwareState = {
  pendingCreation: false,
}

export const stackerLabwareReducer = (
  state: StackerLabwareState = initialState,
  action: StackerLabwareCreationStartAction | StackerLabwareCreationFinishAction
): StackerLabwareState => {
  switch (action.type) {
    case 'STACKER_LABWARE_CREATION_START':
      return { ...state, pendingCreation: true }
    case 'STACKER_LABWARE_CREATION_FINISH':
      return { ...state, pendingCreation: false }
    default:
      return state
  }
}

// If/when FormData becomes a proper union, these should automatically pick up the improved property types.
type ThermocyclerFormData = FormData & { stepType: 'thermocycler' }
type VacuumFormData = FormData & { stepType: 'vacuum' }
type PauseFormData = FormData & { stepType: 'pause' }

interface SaveStepFormHelperArgs {
  action: SaveStepFormAction
  originalOrderedStepIds: StepIdType[]
  originalStepFormsById: Record<StepIdType, FormData>
}
interface SaveStepFormHelperResult {
  newOrderedStepIds: StepIdType[]
  newStepFormsById: Record<StepIdType, FormData>
}

function getVacuumConcurrentPauseKind(
  form: FormData | null
): null | 'profile' | 'stateDuration' {
  if (form == null) {
    return null
  }
  if (getIsVacuumProfileForm(form)) {
    return 'profile'
  }
  if (getIsVacuumStateWithDurationForm(form)) {
    return 'stateDuration'
  }
  return null
}

function getWaitStepIdAfterEnclosingConcurrentGroup(
  findResult: NonNullable<ReturnType<typeof findStep>>
): StepIdType | null {
  const { enclosingNode } = findResult
  if (!('type' in enclosingNode)) {
    return null
  }
  return isConcurrentGroup(enclosingNode) ? enclosingNode.waitStepId : null
}

function saveStepFormHelper(
  args: SaveStepFormHelperArgs
): SaveStepFormHelperResult {
  const { action, originalOrderedStepIds, originalStepFormsById } = args

  const newForm = action.payload.form
  const originalStep: FormData | null =
    originalStepFormsById[newForm.id] ?? null

  const originalOrderedSteps = originalOrderedStepIds.map(
    id => originalStepFormsById[id]
  )
  const originalStepHierarchy =
    convertStepArrayToHierarchy(originalOrderedSteps)

  const findResult = findStep(originalStepHierarchy, newForm.id)

  if (findResult == null) {
    // We're creating a brand new step. Append it to the end.
    // If it's a Thermocycler profile, also pair it with a "wait for profile to complete" step.

    const newThermoPauseForm: PauseFormData | null =
      getThermocyclerFormType(newForm) === 'thermocyclerProfile'
        ? buildThermocyclerProfilePauseForm(
            newForm as ThermocyclerFormData,
            action.payload.concurrentGroupPauseStepId
          )
        : null
    const newVacVacKind = getVacuumConcurrentPauseKind(newForm)
    let newVacuumPauseForm: PauseFormData | null = null
    if (newVacVacKind === 'profile') {
      newVacuumPauseForm = buildVacuumProfilePauseForm(
        newForm as VacuumFormData,
        action.payload.concurrentGroupPauseStepId
      )
    } else if (newVacVacKind === 'stateDuration') {
      newVacuumPauseForm = buildVacuumStateDurationPauseForm(
        newForm as VacuumFormData,
        action.payload.concurrentGroupPauseStepId
      )
    }
    const newPauseForms = [newThermoPauseForm, newVacuumPauseForm].filter(
      (f): f is PauseFormData => f != null
    )
    return {
      newOrderedStepIds: [
        ...originalOrderedStepIds,
        newForm.id,
        ...newPauseForms.map(f => f.id),
      ],
      newStepFormsById: {
        ...originalStepFormsById,
        [newForm.id]: newForm,
        ...Object.fromEntries(newPauseForms.map(f => [f.id, f])),
      },
    }
  } else {
    // We're editing an existing step.
    if (
      getThermocyclerFormType(originalStep) === 'thermocyclerProfile' &&
      getThermocyclerFormType(newForm) !== 'thermocyclerProfile'
    ) {
      // An existing Thermocycler profile step is turning into a non-profile step.
      // We need to delete the hidden "wait for profile to complete" step that it was paired with.

      const pairedStepIds = getPairedSteps(
        originalStepHierarchy,
        new Set([originalStep.id])
      )
      return {
        newOrderedStepIds: originalOrderedStepIds.filter(
          id => !pairedStepIds.has(id)
        ),
        newStepFormsById: {
          ...omit(originalStepFormsById, [...pairedStepIds]),
          [newForm.id]: newForm,
        },
      }
    } else if (
      getVacuumConcurrentPauseKind(originalStep) != null &&
      getVacuumConcurrentPauseKind(newForm) == null
    ) {
      const pairedStepIds = getPairedSteps(
        originalStepHierarchy,
        new Set([originalStep.id])
      )
      return {
        newOrderedStepIds: originalOrderedStepIds.filter(
          id => !pairedStepIds.has(id)
        ),
        newStepFormsById: {
          ...omit(originalStepFormsById, [...pairedStepIds]),
          [newForm.id]: newForm,
        },
      }
    } else if (
      getVacuumConcurrentPauseKind(originalStep) != null &&
      getVacuumConcurrentPauseKind(newForm) != null &&
      getVacuumConcurrentPauseKind(originalStep) !==
        getVacuumConcurrentPauseKind(newForm)
    ) {
      const pairedToRemove = getPairedSteps(
        originalStepHierarchy,
        new Set([originalStep.id])
      )
      const newVacKind = getVacuumConcurrentPauseKind(newForm)
      const newPauseForm =
        newVacKind === 'profile'
          ? buildVacuumProfilePauseForm(
              newForm as VacuumFormData,
              action.payload.concurrentGroupPauseStepId
            )
          : buildVacuumStateDurationPauseForm(
              newForm as VacuumFormData,
              action.payload.concurrentGroupPauseStepId
            )
      const orderWithoutOldPauses = originalOrderedStepIds.filter(
        id => id === newForm.id || !pairedToRemove.has(id)
      )
      const vacuumStepIndex = orderWithoutOldPauses.indexOf(newForm.id)
      if (vacuumStepIndex === -1) {
        console.error(
          'Error rearranging steps for a vacuum concurrent pairing change. Leaving the steps unchanged.'
        )
        return {
          newOrderedStepIds: originalOrderedStepIds,
          newStepFormsById: originalStepFormsById,
        }
      }
      const newOrderedStepIds = [
        ...orderWithoutOldPauses.slice(0, vacuumStepIndex + 1),
        newPauseForm.id,
        ...orderWithoutOldPauses.slice(vacuumStepIndex + 1),
      ]
      return {
        newOrderedStepIds,
        newStepFormsById: {
          ...omit(originalStepFormsById, [...pairedToRemove]),
          [newForm.id]: newForm,
          [newPauseForm.id]: newPauseForm,
        },
      }
    } else if (
      getVacuumConcurrentPauseKind(originalStep) == null &&
      getVacuumConcurrentPauseKind(newForm) != null
    ) {
      const newVacKind = getVacuumConcurrentPauseKind(newForm)
      const newPauseForm =
        newVacKind === 'profile'
          ? buildVacuumProfilePauseForm(
              newForm as VacuumFormData,
              action.payload.concurrentGroupPauseStepId
            )
          : buildVacuumStateDurationPauseForm(
              newForm as VacuumFormData,
              action.payload.concurrentGroupPauseStepId
            )
      const stepIdToMoveEditedStepAfter =
        getWaitStepIdAfterEnclosingConcurrentGroup(findResult)
      const { result: newOrderedStepIds, success: spliceSuccess } =
        findAndSplice({
          source: originalOrderedStepIds,
          elementToRemove: originalStep.id,
          elementToInsertAfter: stepIdToMoveEditedStepAfter,
          elementsToInsert: [newForm.id, newPauseForm.id],
        })
      if (!spliceSuccess) {
        console.error(
          'Error rearranging steps for a new Vacuum concurrent group. Leaving the steps unchanged.'
        )
        return {
          newOrderedStepIds: originalOrderedStepIds,
          newStepFormsById: originalStepFormsById,
        }
      }
      return {
        newOrderedStepIds,
        newStepFormsById: {
          ...originalStepFormsById,
          [newForm.id]: newForm,
          [newPauseForm.id]: newPauseForm,
        },
      }
    } else if (
      getThermocyclerFormType(originalStep) !== 'thermocyclerProfile' &&
      getThermocyclerFormType(newForm) === 'thermocyclerProfile'
    ) {
      // An existing step is turning into a Thermocycler profile step. We need to:
      // 1) Potentially find a new position to move it to, since we can't allow Thermocycler profiles to nest.
      // 2) Create a hidden "wait for profile to complete" step that it will be permanently paired with.

      const newPauseForm = buildThermocyclerProfilePauseForm(
        newForm as ThermocyclerFormData,
        action.payload.concurrentGroupPauseStepId
      )

      // If the edited step was is inside a Thermocycler profile, we'll move it to just after the profile.
      // null means "leave the edited step in-place."
      const stepIdToMoveEditedStepAfter =
        getWaitStepIdAfterEnclosingConcurrentGroup(findResult)

      const { result: newOrderedStepIds, success: spliceSuccess } =
        findAndSplice({
          source: originalOrderedStepIds,
          elementToRemove: originalStep.id,
          elementToInsertAfter: stepIdToMoveEditedStepAfter,
          elementsToInsert: [
            newForm.id,
            ...(newPauseForm != null ? [newPauseForm.id] : []),
          ],
        })

      if (!spliceSuccess) {
        // This should only happen if there's a bug elsewhere that's messing up the timeline order. See `StepHierarchy`.
        console.error(
          'Error rearranging steps for a new Thermocycler profile. Leaving the steps unchanged.'
        )
        return {
          newOrderedStepIds: originalOrderedStepIds,
          newStepFormsById: originalStepFormsById,
        }
      }

      return {
        newOrderedStepIds,
        newStepFormsById: {
          ...originalStepFormsById,
          [newForm.id]: newForm,
          ...(newPauseForm != null && { [newPauseForm.id]: newPauseForm }),
        },
      }
    } else {
      // We're editing an existing step and there's no concurrent profile pairing change,
      // so just update the step to its new value and leave the step order unchanged.
      return {
        newOrderedStepIds: originalOrderedStepIds,
        newStepFormsById: {
          ...originalStepFormsById,
          [newForm.id]: newForm,
        },
      }
    }
  }
}

function buildThermocyclerProfilePauseForm(
  thermocyclerForm: ThermocyclerFormData,
  id: string
): PauseFormData {
  return {
    id,
    stepType: 'pause',
    stepName: 'pause',
    stepDetails: '',

    pauseAction: 'untilThermocyclerProfileComplete',
    moduleId: thermocyclerForm.moduleId,
  }
}

function buildVacuumProfilePauseForm(
  vacuumForm: VacuumFormData,
  id: string
): PauseFormData {
  return {
    id,
    stepType: 'pause',
    stepName: 'pause',
    stepDetails: '',

    pauseAction: PAUSE_UNTIL_VACUUM_PROFILE_COMPLETE,
    moduleId: vacuumForm.moduleId,
  }
}

function buildVacuumStateDurationPauseForm(
  vacuumForm: VacuumFormData,
  id: string
): PauseFormData {
  return {
    id,
    stepType: 'pause',
    stepName: 'pause',
    stepDetails: '',

    pauseAction: PAUSE_UNTIL_VACUUM_STATE_COMPLETE,
    moduleId: vacuumForm.moduleId,
  }
}

export interface RootState {
  unsavedGroup: UnsavedGroupState
  stepGroups: StepGroupsState
  orderedStepIds: OrderedStepIdsState
  labwareDefs: LabwareDefsRootState
  labwareInvariantProperties: NormalizedLabwareById
  pipetteInvariantProperties: NormalizedPipetteById
  moduleInvariantProperties: ModuleEntities
  additionalEquipmentInvariantProperties: NormalizedAdditionalEquipmentById
  presavedStepForm: PresavedStepFormState
  savedStepForms: SavedStepFormState
  unsavedForm: FormState
  batchEditFormChanges: BatchEditFormChangesState
  deckConfiguration: DeckConfigurationState
  stackerLabwareReducer: StackerLabwareState
}
// TODO Ian 2018-12-13: find some existing util to do this
// semi-nested version of combineReducers?
// TODO: Ian 2018-12-13 remove this 'action: any' type
export const rootReducer: Reducer<RootState, any> = nestedCombineReducers(
  ({ action, state, prevStateFallback }) => ({
    unsavedGroup: unsavedGroup(prevStateFallback.unsavedGroup, action),
    stepGroups: stepGroups(prevStateFallback.stepGroups, action),
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
    additionalEquipmentInvariantProperties:
      additionalEquipmentInvariantProperties(
        prevStateFallback.additionalEquipmentInvariantProperties,
        action as ReduxActionsAction<NormalizedAdditionalEquipmentById>
      ),
    labwareDefs: labwareDefsRootReducer(
      prevStateFallback.labwareDefs,
      action as Action
    ),
    // 'forms' reducers get full rootReducer state
    savedStepForms: savedStepForms(state, action as SavedStepFormsActions),
    orderedStepIds: orderedStepIds(state, action as OrderedStepIdsActions),
    unsavedForm: unsavedForm(state, action as UnsavedFormActions),
    presavedStepForm: presavedStepForm(
      prevStateFallback.presavedStepForm,
      action as PresavedStepFormAction
    ),
    batchEditFormChanges: batchEditFormChanges(
      prevStateFallback.batchEditFormChanges,
      action as BatchEditFormActions
    ),
    deckConfiguration: deckConfigurationProperties(
      prevStateFallback.deckConfiguration,
      action
    ),
    stackerLabwareReducer: stackerLabwareReducer(
      prevStateFallback.stackerLabwareReducer,
      action as
        | StackerLabwareCreationStartAction
        | StackerLabwareCreationFinishAction
    ),
  })
)
