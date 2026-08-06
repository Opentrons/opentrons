import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import { createSelector } from 'reselect'

import {
  getLabwareDefURI,
  getPipetteSpecsV2,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  getStackedOnNodeFromPdStack,
  MODULE_INITIAL_STATE_BY_TYPE as STEP_GENERATION_MODULE_INITIAL_STATE_BY_TYPE,
} from '@opentrons/step-generation'

import { getStepVisibilities } from '/protocol-designer/steplist/utils/getStepVisibilities'
import {
  convertStepArrayToHierarchy,
  convertStepHierarchyToArray,
} from '/protocol-designer/steplist/utils/stepHierarchy'

import { INITIAL_DECK_SETUP_STEP_ID } from '../../constants'
import * as featureFlagSelectors from '../../feature-flags/selectors'
import { selectors as labwareDefSelectors } from '../../labware-defs'
import {
  getFormErrors,
  getFormWarnings,
  stepFormToArgs,
} from '../../steplist/formLevel'
import { getMoveLabwareFormErrors } from '../../steplist/formLevel/moveLabwareFormErrors'
import { getProfileFormErrors } from '../../steplist/formLevel/profileErrors'
import { getLocationStackTopToBottom } from '../../utils'
import { denormalizePipetteEntities, getHydratedForm } from '../utils'

import type { Selector } from 'reselect'
import type { DropdownOption, Mount } from '@opentrons/components'
import type {
  LabwareDefinition2,
  LoadedLabwareLocation,
  ModuleType,
  PipetteName,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentEntities,
  AdditionalEquipmentEntity,
  GripperEntities,
  InvariantContext,
  LabwareEntities,
  LabwareEntity,
  LiquidEntities,
  ModuleEntities,
  ModuleTemporalProperties,
  NormalizedAdditionalEquipmentById,
  PipetteEntities,
  RobotState,
  StagingAreaEntities,
  TrashBinEntities,
  WasteChuteEntities,
} from '@opentrons/step-generation'
import type { StepHierarchy } from '/protocol-designer/steplist/utils/stepHierarchy'
import type {
  FormData,
  HydratedFormData,
  HydratedThermocyclerFormData,
  StepIdType,
} from '../../form-types'
import type { LabwareDefByDefURI } from '../../labware-defs'
import type { RootState as LabwareIngredRootState } from '../../labware-ingred/reducers'
import type { FormWarning } from '../../steplist/formLevel'
import type { ProfileFormError } from '../../steplist/formLevel/profileErrors'
import type {
  StepArgsAndErrorsById,
  StepFormErrors,
} from '../../steplist/types'
import type { BaseState, DeckSlot } from '../../types'
import type { DeckConfigurationState } from '../actions'
import type {
  BatchEditFormChangesState,
  PresavedStepFormState,
  RootState,
  SavedStepFormState,
} from '../reducers'
import type {
  FormPipettesByMount,
  InitialDeckSetup,
  LabwareOnDeck,
  ModuleOnDeck,
  ModulesForEditModulesCard,
  NormalizedLabware,
  NormalizedLabwareById,
  PipetteOnDeck,
} from '../types'

const rootSelector = (state: BaseState): RootState => state.stepForms

const labwareIngredRootSelector = (state: BaseState): LabwareIngredRootState =>
  state.labwareIngred

const _getInitialDeckSetupStepFormRootState: (
  arg: RootState
) => FormData = rs => rs.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]

export const getPendingCreationState = (state: BaseState): boolean =>
  rootSelector(state).stackerLabwareReducer.pendingCreation

export const getPresavedStepForm = (state: BaseState): PresavedStepFormState =>
  rootSelector(state).presavedStepForm
export const getCurrentFormIsPresaved: Selector<BaseState, boolean> =
  createSelector(
    getPresavedStepForm,
    presavedStepForm => presavedStepForm != null
  )

const _getNormalizedLiquidById: Selector<BaseState, LiquidEntities> =
  createSelector(labwareIngredRootSelector, state => state.ingredients)

export const getLiquidEntities: Selector<BaseState, LiquidEntities> =
  createSelector(
    _getNormalizedLiquidById,
    normalizedLiquidById => normalizedLiquidById
  )

// NOTE Ian 2019-04-15: outside of this file, you probably only care about
// the labware entity in its denormalized representation, in which case you ought
// to use `getLabwareEntities` instead.
// `_getNormalizedLabwareById` is intended for uses tied to the NormalizedLabware type
const _getNormalizedLabwareById: Selector<BaseState, NormalizedLabwareById> =
  createSelector(rootSelector, state => state.labwareInvariantProperties)

function _hydrateLabwareEntity(
  l: NormalizedLabware,
  labwareId: string,
  defsByURI: LabwareDefByDefURI
): LabwareEntity {
  const def = defsByURI[l.labwareDefURI]
  console.assert(
    def != null,
    `could not hydrate labware ${labwareId}, missing def for URI ${l.labwareDefURI}`
  )
  return { ...l, id: labwareId, def }
}

export const getLabwareEntities: Selector<BaseState, LabwareEntities> =
  createSelector(
    _getNormalizedLabwareById,
    labwareDefSelectors.getLabwareDefsByURI,
    (normalizedLabwareById, labwareDefs) =>
      mapValues(normalizedLabwareById, (l: NormalizedLabware, id: string) =>
        _hydrateLabwareEntity(l, id, labwareDefs)
      )
  )
// Special version of `getLabwareEntities` selector for use in step-forms reducers
export const _getLabwareEntitiesRootState: (
  arg0: RootState
) => LabwareEntities = createSelector(
  (rs: RootState) => rs.labwareInvariantProperties,
  labwareDefSelectors._getLabwareDefsByIdRootState,
  (normalizedLabwareById, labwareDefs) =>
    mapValues(normalizedLabwareById, (l: NormalizedLabware, id: string) =>
      _hydrateLabwareEntity(l, id, labwareDefs)
    )
)
// Special version of `getModuleEntities` selector for use in step-forms reducers
export const _getModuleEntitiesRootState: (
  arg: RootState
) => ModuleEntities = rs => rs.moduleInvariantProperties
export const getModuleEntities: Selector<BaseState, ModuleEntities> =
  createSelector(rootSelector, _getModuleEntitiesRootState)
// Special version of `getPipetteEntities` selector for use in step-forms reducers
export const _getPipetteEntitiesRootState: (arg: RootState) => PipetteEntities =
  createSelector(
    (rs: RootState) => rs.pipetteInvariantProperties,
    labwareDefSelectors._getLabwareDefsByIdRootState,
    _getInitialDeckSetupStepFormRootState,
    (pipetteInvariantProperties, labwareDefs, initialDeckSetupStepForm) =>
      denormalizePipetteEntities(
        pipetteInvariantProperties,
        labwareDefs,
        initialDeckSetupStepForm.pipetteLocationUpdate as Record<string, string>
      )
  )

// Special version of `getAdditionalEquipmentEntities` selector for use in step-forms reducers
export const _getAdditionalEquipmentEntitiesRootState: (
  arg: RootState
) => AdditionalEquipmentEntities = rs =>
  rs.additionalEquipmentInvariantProperties
export const getAdditionalEquipmentEntities: Selector<
  BaseState,
  AdditionalEquipmentEntities
> = createSelector(rootSelector, _getAdditionalEquipmentEntitiesRootState)

export const getPipetteEntities: Selector<BaseState, PipetteEntities> =
  createSelector(rootSelector, _getPipetteEntitiesRootState)

export const _getAdditionalEquipmentRootState: (
  arg: RootState
) => NormalizedAdditionalEquipmentById = rs =>
  rs.additionalEquipmentInvariantProperties

export const getAdditionalEquipment: Selector<
  BaseState,
  NormalizedAdditionalEquipmentById
> = createSelector(rootSelector, _getAdditionalEquipmentRootState)

export const getInitialDeckSetupStepForm: Selector<BaseState, FormData> =
  createSelector(rootSelector, _getInitialDeckSetupStepFormRootState)

const MODULE_INITIAL_STATES_MAP = {
  ...STEP_GENERATION_MODULE_INITIAL_STATE_BY_TYPE,
} as const
MODULE_INITIAL_STATES_MAP satisfies Record<
  ModuleType,
  ModuleTemporalProperties['moduleState']
>

const _getInitialDeckSetup = (
  initialSetupStep: FormData,
  labwareEntities: LabwareEntities,
  pipetteEntities: PipetteEntities,
  moduleEntities: ModuleEntities,
  additionalEquipmentEntities: AdditionalEquipmentEntities
): InitialDeckSetup => {
  console.assert(
    initialSetupStep && initialSetupStep.stepType === 'manualIntervention',
    'expected initial deck setup step to be "manualIntervention" step'
  )

  const labwareLocations: Record<string, string> =
    (initialSetupStep && initialSetupStep.labwareLocationUpdate) || {}
  const moduleLocations: Record<string, string> =
    (initialSetupStep && initialSetupStep.moduleLocationUpdate) || {}
  const pipetteLocations =
    (initialSetupStep && initialSetupStep.pipetteLocationUpdate) || {}
  const labwareStackedOnNodeUpdate =
    (initialSetupStep?.labwareStackedOnNodeUpdate ?? {}) as Record<
      string,
      LoadedLabwareLocation
    >
  const labwareEntityIds = new Set(Object.keys(labwareEntities))

  const modulesRobotState = Object.fromEntries(
    Object.entries(moduleLocations).map(([moduleId, slot]) => [
      moduleId,
      {
        slot,
        moduleState: MODULE_INITIAL_STATES_MAP[moduleEntities[moduleId].type],
      },
    ])
  ) as RobotState['modules']

  // filtering only the additionalEquipmentEntities that are rendered on the deck
  // which for now is wasteChute, trashBin, and stagingArea
  const additionalEquipmentEntitiesOnDeck = Object.values(
    additionalEquipmentEntities
  ).reduce((aeEntities: AdditionalEquipmentEntities, ae) => {
    if (ae.name !== 'gripper') {
      aeEntities[ae.id] = ae
    }
    return aeEntities
  }, {})

  return {
    labware: mapValues<Record<string, string>, LabwareOnDeck>(
      labwareLocations as Record<string, string>,
      (id: string, labwareId: string): LabwareOnDeck => {
        const stack = getLocationStackTopToBottom(
          labwareId,
          labwareLocations,
          moduleLocations,
          moduleEntities
        )
        const stackedOnNode =
          labwareStackedOnNodeUpdate[labwareId] ??
          getStackedOnNodeFromPdStack({
            stack,
            subjectLabwareId: labwareId,
            moduleEntities,
            labwareEntityIds,
            modules: modulesRobotState,
          })
        return {
          stack,
          ...(stackedOnNode != null ? { stackedOnNode } : {}),
          ...labwareEntities[labwareId],
        }
      }
    ),
    modules: mapValues<Record<DeckSlot, string>, ModuleOnDeck>(
      moduleLocations as Record<DeckSlot, string>,
      (slot: DeckSlot, moduleId: string): ModuleOnDeck => {
        const moduleEntity = moduleEntities[moduleId]
        const { id, model, type, pythonName } = moduleEntity
        const baseModuleState = MODULE_INITIAL_STATES_MAP[type]
        const moduleStateUpdate =
          (initialSetupStep && initialSetupStep.moduleStateUpdate) || {}
        const updatedModuleState = moduleStateUpdate[moduleId]
        const moduleState = updatedModuleState || baseModuleState

        if (moduleState == null) {
          console.error(`Unknown module type: ${type}`)
        }

        return {
          id,
          model,
          type,
          slot,
          moduleState,
          pythonName,
        }
      }
    ),
    pipettes: mapValues<{}, PipetteOnDeck>(
      pipetteLocations as Record<Mount, string>,
      (mount: Mount, pipetteId: string): PipetteOnDeck => {
        return { mount, ...pipetteEntities[pipetteId] }
      }
    ),
    additionalEquipmentOnDeck: additionalEquipmentEntitiesOnDeck,
  }
}

export const getInitialDeckSetup: Selector<BaseState, InitialDeckSetup> =
  createSelector(
    getInitialDeckSetupStepForm,
    getLabwareEntities,
    getPipetteEntities,
    getModuleEntities,
    getAdditionalEquipment,
    _getInitialDeckSetup
  )
// Special version of `getLabwareEntities` selector for use in step-forms reducers
export const _getInitialDeckSetupRootState: (
  arg0: RootState
) => InitialDeckSetup = createSelector(
  _getInitialDeckSetupStepFormRootState,
  _getLabwareEntitiesRootState,
  _getPipetteEntitiesRootState,
  _getModuleEntitiesRootState,
  _getAdditionalEquipmentRootState,
  _getInitialDeckSetup
)
export const getPermittedTipracks: Selector<BaseState, string[]> =
  createSelector(getInitialDeckSetup, initialDeckSetup =>
    reduce(
      initialDeckSetup.pipettes,
      (acc: string[], pipette: PipetteOnDeck) => {
        return pipette.tiprackDefURI ? [...acc, ...pipette.tiprackDefURI] : acc
      },
      []
    )
  )

function _getPipetteDisplayName(name: PipetteName): string {
  const pipetteSpecs = getPipetteSpecsV2(name)
  if (!pipetteSpecs) return 'Unknown Pipette'
  return pipetteSpecs.displayName
}

function _getPipettesSame(
  pipettesOnDeck: InitialDeckSetup['pipettes']
): boolean {
  const pipettes = Object.keys(pipettesOnDeck).map(id => {
    return pipettesOnDeck[id]
  })
  return pipettes[0]?.name === pipettes[1]?.name
}

export const getEquippedPipetteOptions = createSelector(
  getInitialDeckSetup,
  (initialDeckSetup): DropdownOption[] => {
    const pipettes = initialDeckSetup.pipettes

    const pipettesSame = _getPipettesSame(pipettes)

    return reduce(
      pipettes,
      (acc: DropdownOption[], pipette: PipetteOnDeck, id: string) => {
        const mountLabel = pipette.mount === 'left' ? '(L)' : '(R)'
        const nextOption = {
          name: pipettesSame
            ? `${_getPipetteDisplayName(pipette.name)} ${mountLabel}`
            : _getPipetteDisplayName(pipette.name),
          value: id,
        }
        return [...acc, nextOption]
      },
      []
    )
  }
)
export const getPipettesForEditPipetteForm: Selector<
  BaseState,
  FormPipettesByMount
> = createSelector(getInitialDeckSetup, initialDeckSetup =>
  reduce<InitialDeckSetup['pipettes'], FormPipettesByMount>(
    initialDeckSetup.pipettes,
    (acc, pipetteOnDeck: PipetteOnDeck, id) => {
      const pipetteSpec = pipetteOnDeck.spec
      const tiprackDefs = pipetteOnDeck.tiprackLabwareDef
      if (!pipetteSpec || !tiprackDefs) return acc
      const pipetteForInstrumentGroup = {
        pipetteName: pipetteOnDeck.name,
        tiprackDefURI: tiprackDefs.map((def: LabwareDefinition2) =>
          getLabwareDefURI(def)
        ),
      }
      acc[pipetteOnDeck.mount] = pipetteForInstrumentGroup
      return acc
    },
    {
      left: {
        pipetteName: null,
        tiprackDefURI: null,
      },
      right: {
        pipetteName: null,
        tiprackDefURI: null,
      },
    }
  )
)
export const getModulesForEditModulesCard: Selector<
  BaseState,
  ModulesForEditModulesCard
> = createSelector(getInitialDeckSetup, initialDeckSetup =>
  reduce<InitialDeckSetup['modules'], ModulesForEditModulesCard>(
    initialDeckSetup.modules,
    (acc, moduleOnDeck: ModuleOnDeck, id) => {
      if (!acc[moduleOnDeck.type]) {
        acc[moduleOnDeck.type] = []
      }
      acc[moduleOnDeck.type]?.push(moduleOnDeck)
      return acc
    },
    {
      [MAGNETIC_MODULE_TYPE]: null,
      [TEMPERATURE_MODULE_TYPE]: null,
      [THERMOCYCLER_MODULE_TYPE]: null,
      [HEATERSHAKER_MODULE_TYPE]: null,
    }
  )
)
export const getUnsavedGroup: Selector<BaseState, StepIdType[]> =
  createSelector(rootSelector, state => state.unsavedGroup)
export const getStepGroups: Selector<
  BaseState,
  Record<string, StepIdType[]>
> = createSelector(rootSelector, state => state.stepGroups)

export const getUnsavedForm: Selector<BaseState, FormData | null | undefined> =
  createSelector(rootSelector, state => state.unsavedForm)

export const getOrderedStepIds: Selector<BaseState, StepIdType[]> =
  createSelector(rootSelector, state => state.orderedStepIds)

export const getSavedStepForms: Selector<BaseState, SavedStepFormState> =
  createSelector(rootSelector, state => state.savedStepForms)

export const getOrderedSavedForms: Selector<BaseState, FormData[]> =
  createSelector(
    getOrderedStepIds,
    getSavedStepForms,
    (orderedStepIds, savedStepForms) => {
      return orderedStepIds
        .map(stepId => savedStepForms[stepId])
        .filter(form => form && form.id != null) // NOTE: for old protocols where stepId could === 0, need to do != null here
    }
  )

export const getSavedStepHierarchy: Selector<BaseState, StepHierarchy> =
  createSelector(getOrderedSavedForms, orderedSavedForms => {
    return convertStepArrayToHierarchy(orderedSavedForms)
  })

/**
 * A mapping from step IDs to the step's user-visible index in the timeline.
 * This is more complicated than just .indexOf() because some steps are hidden and
 * shouldn't be counted (see `StepHierarchy`).
 *
 * Hidden steps get a step number of `null`.
 */
export const getUserVisibleStepNumbers = createSelector(
  getSavedStepHierarchy,
  (stepHierarchy): Record<StepIdType, number | null> => {
    const visibilities = getStepVisibilities(stepHierarchy)
    const allStepIdsAsFlatArray = convertStepHierarchyToArray(stepHierarchy)

    const result: Record<StepIdType, number | null> = {}
    let nextStepNumber = 1
    for (const stepId of allStepIdsAsFlatArray) {
      result[stepId] = visibilities[stepId].isVisibleToUser
        ? nextStepNumber++
        : null
    }

    return result
  }
)

/** If a step is added to the end of the timeline, it will have this number. */
export const getNextUserVisibleStepNumber = createSelector(
  getUserVisibleStepNumbers,
  (userVisibleStepNumbers): number => {
    const isNonNull = (stepNumber: number | null): stepNumber is number =>
      stepNumber !== null
    const stepNumbers = Object.values(userVisibleStepNumbers)
    return (
      Math.max(
        0, // In case there are no steps yet.
        ...stepNumbers.filter(isNonNull)
      ) + 1
    )
  }
)

export const getCurrentFormHasUnsavedChanges: Selector<BaseState, boolean> =
  createSelector(
    getUnsavedForm,
    getSavedStepForms,
    (unsavedForm, savedStepForms) => {
      const id = unsavedForm?.id
      const savedForm = id != null ? savedStepForms[id] : null

      if (savedForm == null) {
        // nonexistent = no unsaved changes
        return false
      }

      return !isEqual(unsavedForm, savedForm)
    }
  )
export const getCurrentFormUnsavedChangedFields: Selector<BaseState, string[]> =
  createSelector(
    getUnsavedForm,
    getSavedStepForms,
    (unsavedForm, savedStepForms) => {
      const id = unsavedForm?.id
      const savedForm = id != null ? savedStepForms[id] : null

      if (savedForm == null || unsavedForm == null) {
        // nonexistent = no unsaved changes
        return []
      }
      const fields = Object.keys(savedForm)
      return fields.reduce<string[]>((acc, field) => {
        return savedForm[field] !== unsavedForm[field] ? [...acc, field] : acc
      }, [])
    }
  )

export const getBatchEditFieldChanges: Selector<
  BaseState,
  BatchEditFormChangesState
> = createSelector(rootSelector, state => state.batchEditFormChanges)
export const getBatchEditFormHasUnsavedChanges = createSelector(
  getBatchEditFieldChanges,
  (changes): boolean => !isEmpty(changes)
)

const _formLevelErrors = (
  hydratedForm: HydratedFormData,
  moduleEntities: ModuleEntities,
  labwareEntities: LabwareEntities
): StepFormErrors => {
  return getFormErrors(
    hydratedForm.stepType,
    hydratedForm,
    moduleEntities,
    labwareEntities
  )
}

const _dynamicFieldFormErrors = (
  hydratedForm: HydratedFormData
): ProfileFormError[] => {
  return getProfileFormErrors(hydratedForm as HydratedThermocyclerFormData)
}

const _dynamicMoveLabwareFieldFormErrors = (
  hydratedForm: HydratedFormData,
  invariantContext: InvariantContext
): ProfileFormError[] => {
  return getMoveLabwareFormErrors(hydratedForm, invariantContext)
}

export const _hasFormLevelErrors = (
  hydratedForm: HydratedFormData,
  invariantContext: InvariantContext
): boolean => {
  if (
    _formLevelErrors(
      hydratedForm,
      invariantContext.moduleEntities,
      invariantContext.labwareEntities
    ).length > 0
  ) {
    return true
  }

  if (
    hydratedForm.stepType === 'thermocycler' &&
    _dynamicFieldFormErrors(hydratedForm).length > 0
  ) {
    return true
  }

  if (
    hydratedForm.stepType === 'moveLabware' &&
    _dynamicMoveLabwareFieldFormErrors(hydratedForm, invariantContext).length >
      0
  ) {
    return true
  }
  return false
}
export const _formHasErrors = (
  hydratedForm: HydratedFormData,
  invariantContext: InvariantContext
): boolean => {
  return _hasFormLevelErrors(hydratedForm, invariantContext)
}
export const getInvariantContext: Selector<BaseState, InvariantContext> =
  createSelector(
    getLabwareEntities,
    getModuleEntities,
    getPipetteEntities,
    getLiquidEntities,
    getAdditionalEquipmentEntities,
    featureFlagSelectors.getDisableModuleRestrictions,
    (
      labwareEntities,
      moduleEntities,
      pipetteEntities,
      liquidEntities,
      additionalEquipmentEntities,
      disableModuleRestrictions
    ) => {
      const stagingAreaEntities = Object.values(
        additionalEquipmentEntities
      ).reduce(
        (acc: StagingAreaEntities, entity: AdditionalEquipmentEntity) => {
          if (entity.name === 'stagingArea') {
            acc[entity.id] = { id: entity.id, location: entity.location }
            return acc
          } else {
            return acc
          }
        },
        {}
      )
      const trashBinEntities = Object.values(
        additionalEquipmentEntities
      ).reduce((acc: TrashBinEntities, entity: AdditionalEquipmentEntity) => {
        if (entity.name === 'trashBin' && entity.pythonName != null) {
          acc[entity.id] = {
            id: entity.id,
            location: entity.location,
            pythonName: entity.pythonName,
          }
          return acc
        } else {
          return acc
        }
      }, {})
      const wasteChuteEntities = Object.values(
        additionalEquipmentEntities
      ).reduce((acc: WasteChuteEntities, entity: AdditionalEquipmentEntity) => {
        if (entity.name === 'wasteChute' && entity.pythonName != null) {
          acc[entity.id] = {
            id: entity.id,
            pythonName: entity.pythonName,
            location: entity.location,
          }
          return acc
        } else {
          return acc
        }
      }, {})
      const gripperEntities = Object.values(additionalEquipmentEntities).reduce(
        (acc: GripperEntities, entity: AdditionalEquipmentEntity) => {
          if (entity.name === 'gripper') {
            acc[entity.id] = {
              id: entity.id,
            }
            return acc
          } else {
            return acc
          }
        },
        {}
      )

      return {
        labwareEntities,
        moduleEntities,
        pipetteEntities,
        liquidEntities,
        trashBinEntities,
        wasteChuteEntities,
        stagingAreaEntities,
        gripperEntities,
        config: {
          OT_PD_DISABLE_MODULE_RESTRICTIONS: Boolean(disableModuleRestrictions),
        },
      }
    }
  )
export const getHydratedUnsavedForm: Selector<
  BaseState,
  HydratedFormData | null
> = createSelector(
  getUnsavedForm,
  getInvariantContext,
  labwareDefSelectors.getLabwareDefsByURI,
  (unsavedForm, invariantContext, allLabwareDefs) => {
    if (unsavedForm == null) return null
    const hydratedForm = getHydratedForm(
      unsavedForm,
      invariantContext,
      allLabwareDefs
    )
    return hydratedForm ?? null
  }
)
export const getDynamicFieldFormErrorsForUnsavedForm: Selector<
  BaseState,
  ProfileFormError[]
> = createSelector(
  getHydratedUnsavedForm,
  getInvariantContext,
  (hydratedForm, invariantContext) => {
    if (!hydratedForm) return []

    const errors = [
      ..._dynamicFieldFormErrors(hydratedForm),
      ..._dynamicMoveLabwareFieldFormErrors(hydratedForm, invariantContext),
    ]

    return errors
  }
)
export const getFormLevelErrorsForUnsavedForm: Selector<
  BaseState,
  StepFormErrors
> = createSelector(
  getHydratedUnsavedForm,
  getInvariantContext,
  (hydratedForm, invariantContext) => {
    if (!hydratedForm) return []

    const errors = _formLevelErrors(
      hydratedForm,
      invariantContext.moduleEntities,
      invariantContext.labwareEntities
    )

    return errors
  }
)
export const getCurrentFormCanBeSaved: Selector<BaseState, boolean> =
  createSelector(
    getHydratedUnsavedForm,
    getInvariantContext,
    (hydratedForm, invariantContext) => {
      if (!hydratedForm) return false
      return !_formHasErrors(hydratedForm, invariantContext)
    }
  )
export const getArgsAndErrorsByStepId: Selector<
  BaseState,
  StepArgsAndErrorsById
> = createSelector(
  getOrderedSavedForms,
  getInvariantContext,
  labwareDefSelectors.getLabwareDefsByURI,
  (stepForms, contextualState, allLabwareDefs) => {
    return reduce(
      stepForms,
      (acc, stepForm, index) => {
        const hydratedForm = getHydratedForm(
          stepForm,
          contextualState,
          allLabwareDefs
        )
        const errors = _formHasErrors(hydratedForm, contextualState)
        const nextStepData = !errors
          ? {
              stepArgs: stepFormToArgs(
                { ...hydratedForm, stepNumber: index + 1 },
                contextualState
              ),
            }
          : {
              errors,
              stepArgs: null,
            }
        return { ...acc, [stepForm.id]: nextStepData }
      },
      {}
    )
  }
)

export const getFormLevelWarningsForUnsavedForm: Selector<
  BaseState,
  FormWarning[]
> = createSelector(
  getUnsavedForm,
  getInvariantContext,
  labwareDefSelectors.getLabwareDefsByURI,
  (unsavedForm, contextualState, allLabwareDefs) => {
    if (!unsavedForm) return []
    const hydratedForm = getHydratedForm(
      unsavedForm,
      contextualState,
      allLabwareDefs
    )
    return getFormWarnings(unsavedForm.stepType, hydratedForm)
  }
)

export const getFormLevelWarningsPerStep: Selector<
  BaseState,
  Record<string, FormWarning[]>
> = createSelector(
  getSavedStepForms,
  getInvariantContext,
  labwareDefSelectors.getLabwareDefsByURI,
  (forms, contextualState, allLabwareDefs) =>
    mapValues(forms, (form, stepId) => {
      if (!form) return []
      const hydratedForm = getHydratedForm(
        form,
        contextualState,
        allLabwareDefs
      )
      return getFormWarnings(form.stepType, hydratedForm)
    })
)

export const getDeckConfiguration = (
  state: BaseState
): DeckConfigurationState => rootSelector(state).deckConfiguration
