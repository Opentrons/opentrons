// @flow
import assert from 'assert'
import { handleActions } from 'redux-actions'
import mapValues from 'lodash/mapValues'
import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import reduce from 'lodash/reduce'
import {
  getLabwareDefaultEngageHeight,
  getLabwareDefURI,
  getModuleType,
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  rootReducer as labwareDefsRootReducer,
  type RootState as LabwareDefsRootState,
} from '../../labware-defs'
import { uuid } from '../../utils'
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
import { PRESAVED_STEP_ID } from '../../steplist/types'
import {
  _getPipetteEntitiesRootState,
  _getLabwareEntitiesRootState,
  _getInitialDeckSetupRootState,
} from '../selectors'
import { getLabwareIsCompatible } from '../../utils/labwareModuleCompatibility'
import {
  createPresavedStepForm,
  getDeckItemIdInSlot,
  getIdsInRange,
} from '../utils'
import {
  createInitialProfileCycle,
  createInitialProfileStep,
} from '../utils/createInitialProfileItems'
import { getLabwareOnModule } from '../../ui/modules/utils'
import { PROFILE_CYCLE, PROFILE_STEP } from '../../form-types'
import type { Reducer } from 'redux'
import type { LoadFileAction } from '../../load-file'
import type {
  CreateContainerAction,
  DeleteContainerAction,
  DuplicateLabwareAction,
  SwapSlotContentsAction,
} from '../../labware-ingred/actions'
import type { ReplaceCustomLabwareDef } from '../../labware-defs/actions'
import type {
  FormData,
  StepIdType,
  StepType,
  ProfileItem,
  ProfileCycleItem,
  ProfileStepItem,
} from '../../form-types'
import type {
  FileLabware,
  FilePipette,
  FileModule,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type {
  CancelStepFormAction,
  ChangeFormInputAction,
  ChangeSavedStepFormAction,
  DeleteStepAction,
  PopulateFormAction,
  ReorderStepsAction,
  AddProfileCycleAction,
  AddProfileStepAction,
  DeleteProfileCycleAction,
  DeleteProfileStepAction,
  EditProfileCycleAction,
  EditProfileStepAction,
} from '../../steplist/actions'
import type {
  AddStepAction,
  DuplicateStepAction,
  ReorderSelectedStepAction,
  SelectStepAction,
  SelectTerminalItemAction,
} from '../../ui/steps/actions/types'
import type { SaveStepFormAction } from '../../ui/steps/actions/thunks'
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
} from '../actions'

type FormState = FormData | null

const unsavedFormInitialState = null
// the `unsavedForm` state holds temporary form info that is saved or thrown away with "cancel".
type UnsavedFormActions =
  | AddProfileCycleAction
  | AddStepAction
  | ChangeFormInputAction
  | PopulateFormAction
  | CancelStepFormAction
  | SaveStepFormAction
  | DeleteStepAction
  | SelectTerminalItemAction
  | EditModuleAction
  | SubstituteStepFormPipettesAction
  | AddProfileStepAction
  | DeleteProfileStepAction
  | DeleteProfileCycleAction
  | EditProfileCycleAction
  | EditProfileStepAction
export const unsavedForm = (
  rootState: RootState,
  action: UnsavedFormActions
): FormState => {
  const unsavedFormState = rootState
    ? rootState.unsavedForm
    : unsavedFormInitialState
  switch (action.type) {
    case 'ADD_PROFILE_CYCLE': {
      if (unsavedFormState?.stepType !== 'thermocycler') {
        console.error(
          'ADD_PROFILE_CYCLE should only be dispatched when unsaved form is "thermocycler" form'
        )
        return unsavedFormState
      }
      const id = uuid()

      return {
        ...unsavedFormState,
        orderedProfileItems: [...unsavedFormState.orderedProfileItems, id],
        profileItemsById: {
          ...unsavedFormState.profileItemsById,
          [id]: createInitialProfileCycle(id),
        },
      }
    }
    case 'ADD_STEP': {
      return createPresavedStepForm({
        stepType: action.payload.stepType,
        stepId: action.payload.id,
        pipetteEntities: _getPipetteEntitiesRootState(rootState),
        labwareEntities: _getLabwareEntitiesRootState(rootState),
        savedStepForms: rootState.savedStepForms,
        orderedStepIds: rootState.orderedStepIds,
        initialDeckSetup: _getInitialDeckSetupRootState(rootState),
      })
    }
    case 'CHANGE_FORM_INPUT': {
      const fieldUpdate = handleFormChange(
        action.payload.update,
        unsavedFormState,
        _getPipetteEntitiesRootState(rootState),
        _getLabwareEntitiesRootState(rootState)
      )
      // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
      return {
        ...unsavedFormState,
        ...fieldUpdate,
      }
    }
    case 'POPULATE_FORM':
      return action.payload
    case 'CANCEL_STEP_FORM':
    case 'SELECT_TERMINAL_ITEM':
    case 'SAVE_STEP_FORM':
    case 'DELETE_STEP':
    case 'EDIT_MODULE':
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
        unsavedFormState?.pipette && // TODO(IL, 2020-06-02): Flow should know unsavedFormState is not null here (so keys are safe to access), but it's being dumb
        unsavedFormState.pipette in substitutionMap &&
        unsavedFormState.id &&
        stepIdsToUpdate.includes(unsavedFormState.id)
      ) {
        // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
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
    case 'ADD_PROFILE_STEP': {
      if (unsavedFormState?.stepType !== 'thermocycler') {
        console.error(
          'ADD_PROFILE_STEP should only be dispatched when unsaved form is "thermocycler" form'
        )
        return unsavedFormState
      }
      const id = uuid()

      const newStep = createInitialProfileStep(id)

      if (action.payload !== null) {
        const { cycleId } = action.payload
        const targetCycle = unsavedFormState.profileItemsById[cycleId]
        // add to cycle
        return {
          ...unsavedFormState,
          profileItemsById: {
            ...unsavedFormState.profileItemsById,
            [cycleId]: {
              ...targetCycle,
              steps: [...targetCycle.steps, newStep],
            },
          },
        }
      }
      // TODO factor this createInitialProfileStep out somewhere

      return {
        ...unsavedFormState,
        orderedProfileItems: [...unsavedFormState.orderedProfileItems, id],
        profileItemsById: {
          ...unsavedFormState.profileItemsById,
          [id]: newStep,
        },
      }
    }
    case 'DELETE_PROFILE_CYCLE': {
      if (unsavedFormState?.stepType !== 'thermocycler') {
        console.error(
          'DELETE_PROFILE_CYCLE should only be dispatched when unsaved form is "thermocycler" form'
        )
        return unsavedFormState
      }

      const { id } = action.payload
      const isCycle =
        unsavedFormState.profileItemsById[id].type === PROFILE_CYCLE
      if (!isCycle) {
        return unsavedFormState
      }
      return {
        ...unsavedFormState,
        orderedProfileItems: unsavedFormState.orderedProfileItems.filter(
          itemId => itemId !== id
        ),
        profileItemsById: omit(unsavedFormState.profileItemsById, id),
      }
    }
    case 'DELETE_PROFILE_STEP': {
      if (unsavedFormState?.stepType !== 'thermocycler') {
        console.error(
          'DELETE_PROFILE_STEP should only be dispatched when unsaved form is "thermocycler" form'
        )
        return unsavedFormState
      }

      const { id } = action.payload

      const omitTopLevelSteps = (profileItemsById: {
        [string]: ProfileItem,
        ...,
      }) =>
        omitBy(
          profileItemsById,
          (item: ProfileItem, itemId: string): boolean => {
            return item.type === PROFILE_STEP && itemId === id
          }
        )

      // not top-level, must be nested inside a cycle
      const omitCycleSteps = (profileItemsById: {
        [string]: ProfileItem,
        ...,
      }) =>
        mapValues(profileItemsById, (item: ProfileItem): ProfileItem => {
          if (item.type === PROFILE_CYCLE) {
            return {
              ...item,
              steps: item.steps.filter(
                (stepItem: ProfileStepItem) => stepItem.id !== id
              ),
            }
          }
          return item
        })

      const isTopLevelProfileStep =
        unsavedFormState.orderedProfileItems.includes(id) &&
        unsavedFormState.profileItemsById[id].type === PROFILE_STEP

      const filteredItemsById = isTopLevelProfileStep
        ? omitTopLevelSteps(unsavedFormState.profileItemsById)
        : omitCycleSteps(unsavedFormState.profileItemsById)

      const filteredOrderedProfileItems = isTopLevelProfileStep
        ? unsavedFormState.orderedProfileItems.filter(itemId => itemId !== id)
        : unsavedFormState.orderedProfileItems

      return {
        ...unsavedFormState,
        orderedProfileItems: filteredOrderedProfileItems,
        profileItemsById: filteredItemsById,
      }
    }
    case 'EDIT_PROFILE_CYCLE': {
      if (unsavedFormState?.stepType !== 'thermocycler') {
        console.error(
          'EDIT_PROFILE_CYCLE should only be dispatched when unsaved form is "thermocycler" form'
        )
        return unsavedFormState
      }

      const { id, fields } = action.payload

      const cycle = unsavedFormState.profileItemsById[id]

      if (cycle.type !== PROFILE_CYCLE) {
        console.warn(
          `EDIT_PROFILE_CYCLE got non-cycle profile item ${cycle.id}`
        )
        return unsavedFormState
      }

      return {
        ...unsavedFormState,
        profileItemsById: {
          ...unsavedFormState.profileItemsById,
          [id]: {
            ...cycle,
            ...fields,
          },
        },
      }
    }
    case 'EDIT_PROFILE_STEP': {
      if (unsavedFormState?.stepType !== 'thermocycler') {
        console.error(
          'EDIT_PROFILE_STEP should only be dispatched when unsaved form is "thermocycler" form'
        )
        return unsavedFormState
      }

      const { id, fields } = action.payload

      const isTopLevelStep =
        unsavedFormState.orderedProfileItems.includes(id) &&
        unsavedFormState.profileItemsById[id].type === PROFILE_STEP

      if (isTopLevelStep) {
        return {
          ...unsavedFormState,
          profileItemsById: {
            ...unsavedFormState.profileItemsById,
            [id]: { ...unsavedFormState.profileItemsById[id], ...fields },
          },
        }
      } else {
        // it's a step in a cycle. Get the cycle id, and the index of our edited step in that cycle's `steps` array
        let editedStepIndex = -1
        const cycleId: string | void = Object.keys(
          unsavedFormState.profileItemsById
        ).find((itemId: string): boolean => {
          const item: ProfileItem = unsavedFormState.profileItemsById[itemId]
          if (item.type === PROFILE_CYCLE) {
            const stepIndex = item.steps.findIndex(step => step.id === id)
            if (stepIndex !== -1) {
              editedStepIndex = stepIndex
              return true
            }
          }
          return false
        })

        if (cycleId == null || editedStepIndex === -1) {
          console.warn(`EDIT_PROFILE_STEP: step does not exist ${id}`)
          return unsavedFormState
        }

        let newCycle: ProfileCycleItem = {
          ...unsavedFormState.profileItemsById[cycleId],
        }

        const newSteps = [...newCycle.steps]

        newSteps[editedStepIndex] = {
          ...newCycle.steps[editedStepIndex],
          ...fields,
        }

        newCycle = {
          ...newCycle,
          steps: newSteps,
        }

        const newProfileItems = {
          ...unsavedFormState.profileItemsById,
          [cycleId]: newCycle,
        }
        return {
          ...unsavedFormState,
          profileItemsById: newProfileItems,
        }
      }
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
  | EditModuleAction

export const _editModuleFormUpdate = ({
  savedForm,
  moduleId,
  formId,
  rootState,
  nextModuleModel,
}: {|
  savedForm: FormData,
  moduleId: string,
  formId: string,
  rootState: RootState,
  nextModuleModel: string,
|}): FormData => {
  if (
    savedForm.stepType === 'magnet' &&
    savedForm.moduleId === moduleId &&
    savedForm.magnetAction === 'engage'
  ) {
    const prevEngageHeight = parseFloat(savedForm.engageHeight)

    if (Number.isFinite(prevEngageHeight)) {
      const initialDeckSetup = _getInitialDeckSetupRootState(rootState)
      const labwareEntity = getLabwareOnModule(initialDeckSetup, moduleId)
      const labwareDefaultEngageHeight = labwareEntity
        ? getLabwareDefaultEngageHeight(labwareEntity.def)
        : null
      const moduleEntity = initialDeckSetup.modules[moduleId]
      assert(
        moduleEntity,
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
    return {
      ...savedForm,
      engageHeight: blankEngageHeight,
    }
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
      const labwareId: string =
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
    case 'EDIT_MODULE': {
      const moduleId = action.payload.id
      return mapValues(savedStepForms, (savedForm: FormData, formId) =>
        _editModuleFormUpdate({
          moduleId,
          savedForm,
          formId,
          rootState,
          nextModuleModel: action.payload.model,
        })
      )
    }
    case 'MOVE_DECK_ITEM': {
      const { sourceSlot, destSlot } = action.payload
      return mapValues(savedStepForms, (savedForm: FormData): FormData => {
        if (savedForm.stepType === 'manualIntervention') {
          // swap labware/module slots from all manualIntervention steps
          // (or place compatible labware in dest slot onto module)
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

          if (sourceModuleId && destLabwareId) {
            // moving module to a destination slot with labware
            const prevInitialDeckSetup = _getInitialDeckSetupRootState(
              rootState
            )
            const moduleEntity = prevInitialDeckSetup.modules[sourceModuleId]
            const labwareEntity = prevInitialDeckSetup.labware[destLabwareId]

            const isCompat = getLabwareIsCompatible(
              labwareEntity.def,
              moduleEntity.type
            )
            const moduleIsOccupied =
              getDeckItemIdInSlot(
                savedForm.labwareLocationUpdate,
                sourceModuleId
              ) != null

            if (isCompat && !moduleIsOccupied) {
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

          const labwareLocationUpdate: { [labwareId: string]: string } = {
            ...savedForm.labwareLocationUpdate,
          }
          if (sourceLabwareId != null) {
            labwareLocationUpdate[sourceLabwareId] = destSlot
          }
          if (destLabwareId != null) {
            labwareLocationUpdate[destLabwareId] = sourceSlot
          }

          const moduleLocationUpdate: { [moduleId: string]: string } = {
            ...savedForm.moduleLocationUpdate,
          }
          if (sourceModuleId != null) {
            moduleLocationUpdate[sourceModuleId] = destSlot
          }
          if (destModuleId != null) {
            moduleLocationUpdate[destModuleId] = sourceSlot
          }

          return {
            ...savedForm,
            labwareLocationUpdate,
            moduleLocationUpdate,
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
        const deleteLabwareUpdate = reduce<FormData, FormData>(
          savedForm,
          (acc, value, fieldName) => {
            if (value === labwareIdToDelete) {
              // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
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
        // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
        return {
          ...savedForm,
          ...deleteLabwareUpdate,
        }
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
        } else if (deletedPipetteIds.includes(form.pipette)) {
          // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
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
          // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
          [stepId]: {
            ...prevStepForm,
            ...updatedFields,
          },
        }
      }, {})
      // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
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
        // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
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

      const savedStepsUpdate = stepIds.reduce<SavedStepFormState>(
        (acc, stepId) => {
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
            // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
            [stepId]: {
              ...prevStepForm,
              ...updatedFields,
            },
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

const initialLabwareState: NormalizedLabwareById = {
  [FIXED_TRASH_ID]: {
    labwareDefURI: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
  },
}

// MIGRATION NOTE: copied from `containers` reducer. Slot + UI stuff stripped out.
export const labwareInvariantProperties: Reducer<
  NormalizedLabwareById,
  any
> = handleActions(
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

export const moduleInvariantProperties: Reducer<
  ModuleEntities,
  any
> = handleActions(
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
          type: getModuleType(fileModule.model),
          model: fileModule.model,
        })
      )
    },
  },
  {}
)

const initialPipetteState = {}

export const pipetteInvariantProperties: Reducer<
  NormalizedPipetteById,
  any
> = handleActions(
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

export type OrderedStepIdsState = Array<StepIdType>
const initialOrderedStepIdsState = []
export const orderedStepIds: Reducer<OrderedStepIdsState, any> = handleActions(
  {
    SAVE_STEP_FORM: (
      state: OrderedStepIdsState,
      action: SaveStepFormAction
    ) => {
      const id = action.payload.id
      if (!state.includes(id)) {
        return [...state, id]
      }
      return state
    },
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

export type PresavedStepFormState = {|
  stepType: StepType,
|} | null
type PresavedStepFormAction =
  | AddStepAction
  | CancelStepFormAction
  | DeleteStepAction
  | SaveStepFormAction
  | SelectTerminalItemAction
  | SelectStepAction
export const presavedStepForm = (
  state: PresavedStepFormState = null,
  action: PresavedStepFormAction
): PresavedStepFormState => {
  switch (action.type) {
    case 'ADD_STEP':
      return { stepType: action.payload.stepType }
    case 'SELECT_TERMINAL_ITEM':
      return action.payload === PRESAVED_STEP_ID ? state : null
    case 'CANCEL_STEP_FORM':
    case 'DELETE_STEP':
    case 'SAVE_STEP_FORM':
    case 'SELECT_STEP':
      return null
    default:
      return state
  }
}

export type RootState = {
  orderedStepIds: OrderedStepIdsState,
  labwareDefs: LabwareDefsRootState,
  labwareInvariantProperties: NormalizedLabwareById,
  pipetteInvariantProperties: NormalizedPipetteById,
  moduleInvariantProperties: ModuleEntities,
  presavedStepForm: PresavedStepFormState,
  savedStepForms: SavedStepFormState,
  unsavedForm: FormState,
}

// TODO Ian 2018-12-13: find some existing util to do this
// semi-nested version of combineReducers?
// TODO: Ian 2018-12-13 remove this 'action: any' type
export const rootReducer: Reducer<RootState, any> = (state, action) => {
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
    // 'forms' reducers get full rootReducer state
    // $FlowFixMe TODO(IL, 2020-06-08): savedStepForms should be typed as `Reducer` (which makes state: RootState | void)
    savedStepForms: savedStepForms(state, action),
    // $FlowFixMe TODO(IL, 2020-06-08): unsavedForm should be typed as `Reducer` (which makes state: RootState | void)
    unsavedForm: unsavedForm(state, action),
    presavedStepForm: presavedStepForm(
      prevStateFallback.presavedStepForm,
      action
    ),
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
