// @flow
import type { ElementProps } from 'react'
import assert from 'assert'
import isEqual from 'lodash/isEqual'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import { createSelector } from 'reselect'
import {
  getPipetteNameSpecs,
  getLabwareDisplayName,
  getLabwareDefURI,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  INITIAL_DECK_SETUP_STEP_ID,
  TEMPERATURE_DEACTIVATED,
} from '../../constants'
import {
  getFormWarnings,
  getFormErrors,
  stepFormToArgs,
} from '../../steplist/formLevel'
import {
  getProfileFormErrors,
  type ProfileFormError,
} from '../../steplist/formLevel/profileErrors'
import { hydrateField, getFieldErrors } from '../../steplist/fieldLevel'
import { getProfileItemsHaveErrors } from '../utils/getProfileItemsHaveErrors'
import { denormalizePipetteEntities } from '../utils'
import {
  selectors as labwareDefSelectors,
  type LabwareDefByDefURI,
} from '../../labware-defs'

import { typeof InstrumentGroup as InstrumentGroupProps } from '@opentrons/components'
import type {
  DropdownOption,
  Mount,
  InstrumentInfoProps,
} from '@opentrons/components'
import type { FormWarning } from '../../steplist/formLevel'
import type { BaseState, Selector, DeckSlot } from '../../types'
import type { FormData, StepIdType } from '../../form-types'
import type {
  StepArgsAndErrorsById,
  StepFormErrors,
} from '../../steplist/types'
import type {
  InitialDeckSetup,
  NormalizedLabwareById,
  NormalizedLabware,
  LabwareOnDeck,
  LabwareEntity,
  LabwareEntities,
  MagneticModuleState,
  ModuleOnDeck,
  ModuleEntity,
  ModuleEntities,
  ModulesForEditModulesCard,
  PipetteEntities,
  PipetteOnDeck,
  FormPipettesByMount,
  TemperatureModuleState,
  ThermocyclerModuleState,
} from '../types'
import type {
  PresavedStepFormState,
  RootState,
  SavedStepFormState,
} from '../reducers'
import type { InvariantContext } from '../../step-generation'

const rootSelector = (state: BaseState): RootState => state.stepForms

export const getPresavedStepForm = (state: BaseState): PresavedStepFormState =>
  rootSelector(state).presavedStepForm

export const getCurrentFormIsPresaved: Selector<boolean> = createSelector(
  getPresavedStepForm,
  presavedStepForm => presavedStepForm != null
)

// NOTE Ian 2019-04-15: outside of this file, you probably only care about
// the labware entity in its denormalized representation, in which case you ought
// to use `getLabwareEntities` instead.
// `_getNormalizedLabwareById` is intended for uses tied to the NormalizedLabware type
const _getNormalizedLabwareById: Selector<NormalizedLabwareById> = createSelector(
  rootSelector,
  state => state.labwareInvariantProperties
)

function _hydrateLabwareEntity(
  l: NormalizedLabware,
  labwareId: string,
  defsByURI: LabwareDefByDefURI
): LabwareEntity {
  const def = defsByURI[l.labwareDefURI]
  assert(
    def,
    `could not hydrate labware ${labwareId}, missing def for URI ${l.labwareDefURI}`
  )
  return {
    ...l,
    id: labwareId,
    def,
  }
}

export const getLabwareEntities: Selector<LabwareEntities> = createSelector(
  _getNormalizedLabwareById,
  labwareDefSelectors.getLabwareDefsByURI,
  (normalizedLabwareById, labwareDefs) =>
    mapValues(normalizedLabwareById, (l: NormalizedLabware, id: string) =>
      _hydrateLabwareEntity(l, id, labwareDefs)
    )
)

// Special version of `getLabwareEntities` selector for use in step-forms reducers
export const _getLabwareEntitiesRootState: RootState => LabwareEntities = createSelector(
  rs => rs.labwareInvariantProperties,
  labwareDefSelectors._getLabwareDefsByIdRootState,
  (normalizedLabwareById, labwareDefs) =>
    mapValues(normalizedLabwareById, (l: NormalizedLabware, id: string) =>
      _hydrateLabwareEntity(l, id, labwareDefs)
    )
)

// Special version of `getModuleEntities` selector for use in step-forms reducers
export const _getModuleEntitiesRootState: RootState => ModuleEntities = rs =>
  rs.moduleInvariantProperties

export const getModuleEntities: Selector<ModuleEntities> = createSelector(
  rootSelector,
  _getModuleEntitiesRootState
)

// Special version of `getPipetteEntities` selector for use in step-forms reducers
export const _getPipetteEntitiesRootState: RootState => PipetteEntities = createSelector(
  rs => rs.pipetteInvariantProperties,
  labwareDefSelectors._getLabwareDefsByIdRootState,
  denormalizePipetteEntities
)

export const getPipetteEntities: Selector<PipetteEntities> = createSelector(
  rootSelector,
  _getPipetteEntitiesRootState
)

const _getInitialDeckSetupStepFormRootState: RootState => FormData = rs =>
  rs.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]

export const getInitialDeckSetupStepForm: Selector<FormData> = createSelector(
  rootSelector,
  _getInitialDeckSetupStepFormRootState
)

const MAGNETIC_MODULE_INITIAL_STATE: MagneticModuleState = {
  type: MAGNETIC_MODULE_TYPE,
  engaged: false,
}
const TEMPERATURE_MODULE_INITIAL_STATE: TemperatureModuleState = {
  type: TEMPERATURE_MODULE_TYPE,
  status: TEMPERATURE_DEACTIVATED,
  targetTemperature: null,
}
const THERMOCYCLER_MODULE_INITIAL_STATE: ThermocyclerModuleState = {
  type: THERMOCYCLER_MODULE_TYPE,
  blockTargetTemp: null,
  lidTargetTemp: null,
  lidOpen: null,
}

const _getInitialDeckSetup = (
  initialSetupStep: FormData,
  labwareEntities: LabwareEntities,
  pipetteEntities: PipetteEntities,
  moduleEntities: ModuleEntities
): InitialDeckSetup => {
  assert(
    initialSetupStep && initialSetupStep.stepType === 'manualIntervention',
    'expected initial deck setup step to be "manualIntervention" step'
  )
  const labwareLocations =
    (initialSetupStep && initialSetupStep.labwareLocationUpdate) || {}
  const moduleLocations =
    (initialSetupStep && initialSetupStep.moduleLocationUpdate) || {}
  const pipetteLocations =
    (initialSetupStep && initialSetupStep.pipetteLocationUpdate) || {}
  return {
    labware: mapValues(
      labwareLocations,
      (slot: DeckSlot, labwareId: string): LabwareOnDeck => {
        return { slot, ...labwareEntities[labwareId] }
      }
    ),
    modules: mapValues(
      moduleLocations,
      (slot: DeckSlot, moduleId: string): ModuleOnDeck => {
        const moduleEntity = moduleEntities[moduleId]
        if (moduleEntity.type === MAGNETIC_MODULE_TYPE) {
          return {
            id: moduleEntity.id,
            model: moduleEntity.model,
            type: MAGNETIC_MODULE_TYPE,
            slot,
            moduleState: MAGNETIC_MODULE_INITIAL_STATE,
          }
        } else if (moduleEntity.type === TEMPERATURE_MODULE_TYPE) {
          return {
            id: moduleEntity.id,
            model: moduleEntity.model,
            type: TEMPERATURE_MODULE_TYPE,
            slot,
            moduleState: TEMPERATURE_MODULE_INITIAL_STATE,
          }
        } else {
          return {
            id: moduleEntity.id,
            model: moduleEntity.model,
            type: THERMOCYCLER_MODULE_TYPE,
            slot,
            moduleState: THERMOCYCLER_MODULE_INITIAL_STATE,
          }
        }
      }
    ),
    pipettes: mapValues(
      pipetteLocations,
      (mount: Mount, pipetteId: string): PipetteOnDeck => {
        return { mount, ...pipetteEntities[pipetteId] }
      }
    ),
  }
}
export const getInitialDeckSetup: Selector<InitialDeckSetup> = createSelector(
  getInitialDeckSetupStepForm,
  getLabwareEntities,
  getPipetteEntities,
  getModuleEntities,
  _getInitialDeckSetup
)

// Special version of `getLabwareEntities` selector for use in step-forms reducers
export const _getInitialDeckSetupRootState: RootState => InitialDeckSetup = createSelector(
  _getInitialDeckSetupStepFormRootState,
  _getLabwareEntitiesRootState,
  _getPipetteEntitiesRootState,
  _getModuleEntitiesRootState,
  _getInitialDeckSetup
)

export const getPermittedTipracks: Selector<Array<string>> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    reduce(
      initialDeckSetup.pipettes,
      (acc: Array<string>, pipette: PipetteOnDeck) => {
        return pipette.tiprackDefURI ? [...acc, pipette.tiprackDefURI] : acc
      },
      []
    )
)

function _getPipetteDisplayName(name: string): string {
  const pipetteSpecs = getPipetteNameSpecs(name)
  if (!pipetteSpecs) return 'Unknown Pipette'
  return pipetteSpecs.displayName
}

// TODO: Ian 2018-12-20 EVENTUALLY make this `getEquippedPipetteOptionsForStepId`, so it tells you
// equipped pipettes per step id instead of always using initial deck setup
// (for when we support multiple deck setup steps)
export const getEquippedPipetteOptions: Selector<
  Array<DropdownOption>
> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    reduce(
      initialDeckSetup.pipettes,
      (acc: Array<DropdownOption>, pipette: PipetteOnDeck, id: string) => {
        const nextOption = {
          name: _getPipetteDisplayName(pipette.name),
          value: id,
        }
        return [...acc, nextOption]
      },
      []
    )
)

// Formats pipette data specifically for file page InstrumentGroup component
type PipettesForInstrumentGroup = ElementProps<InstrumentGroupProps>
export const getPipettesForInstrumentGroup: Selector<PipettesForInstrumentGroup> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    reduce(
      initialDeckSetup.pipettes,
      (
        acc: PipettesForInstrumentGroup,
        pipetteOnDeck: PipetteOnDeck,
        pipetteId
      ) => {
        const pipetteSpec = pipetteOnDeck.spec
        const tiprackDef = pipetteOnDeck.tiprackLabwareDef

        const pipetteForInstrumentGroup: InstrumentInfoProps = {
          mount: pipetteOnDeck.mount,
          pipetteSpecs: pipetteSpec,
          description: _getPipetteDisplayName(pipetteOnDeck.name),
          isDisabled: false,
          tiprackModel: getLabwareDisplayName(tiprackDef),
        }

        acc[pipetteOnDeck.mount] = pipetteForInstrumentGroup
        return acc
      },
      {}
    )
)

export const getPipettesForEditPipetteForm: Selector<FormPipettesByMount> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    reduce<$PropertyType<InitialDeckSetup, 'pipettes'>, FormPipettesByMount>(
      initialDeckSetup.pipettes,
      (acc, pipetteOnDeck: PipetteOnDeck, id) => {
        const pipetteSpec = pipetteOnDeck.spec
        const tiprackDef = pipetteOnDeck.tiprackLabwareDef

        if (!pipetteSpec || !tiprackDef) return acc

        const pipetteForInstrumentGroup = {
          pipetteName: pipetteOnDeck.name,
          tiprackDefURI: getLabwareDefURI(tiprackDef),
        }

        acc[pipetteOnDeck.mount] = pipetteForInstrumentGroup
        return acc
      },
      {
        left: { pipetteName: null, tiprackDefURI: null },
        right: { pipetteName: null, tiprackDefURI: null },
      }
    )
)

export const getModulesForEditModulesCard: Selector<ModulesForEditModulesCard> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    reduce<
      $PropertyType<InitialDeckSetup, 'modules'>,
      ModulesForEditModulesCard
    >(
      initialDeckSetup.modules,
      (acc, moduleOnDeck: ModuleOnDeck, id) => {
        acc[moduleOnDeck.type] = moduleOnDeck
        return acc
      },
      {
        [MAGNETIC_MODULE_TYPE]: null,
        [TEMPERATURE_MODULE_TYPE]: null,
        [THERMOCYCLER_MODULE_TYPE]: null,
      }
    )
)

export const getUnsavedForm: Selector<?FormData> = createSelector(
  rootSelector,
  state => state.unsavedForm
)

export const getOrderedStepIds: Selector<Array<StepIdType>> = createSelector(
  rootSelector,
  state => state.orderedStepIds
)

export const getSavedStepForms: Selector<SavedStepFormState> = createSelector(
  rootSelector,
  state => state.savedStepForms
)

const getOrderedSavedForms: Selector<Array<FormData>> = createSelector(
  getOrderedStepIds,
  getSavedStepForms,
  (orderedStepIds, savedStepForms) => {
    return orderedStepIds
      .map(stepId => savedStepForms[stepId])
      .filter(form => form && form.id != null) // NOTE: for old protocols where stepId could === 0, need to do != null here
  }
)

export const getCurrentFormHasUnsavedChanges: Selector<boolean> = createSelector(
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

const getModuleEntity = (state: InvariantContext, id: string): ModuleEntity => {
  return state.moduleEntities[id]
}

// TODO: Ian 2019-01-25 type with hydrated form type, see #3161
function _getHydratedForm(
  rawForm: ?FormData,
  invariantContext: InvariantContext
) {
  const hydratedForm = mapValues(rawForm, (value, name) =>
    hydrateField(invariantContext, name, value)
  )
  // TODO(IL, 2020-03-23): separate hydrated/denormalized fields from the other fields.
  // It's confusing that pipette is an ID string before this,
  // but a PipetteEntity object after this.
  // For `moduleId` field, it would be surprising to be a ModuleEntity!
  // Consider nesting all additional fields under 'meta' key,
  // following what we're doing with 'module'.
  // See #3161
  hydratedForm.meta = {}
  if (rawForm?.moduleId != null) {
    hydratedForm.meta.module = getModuleEntity(
      invariantContext,
      rawForm.moduleId
    )
  }
  return hydratedForm
}

// TODO type with hydrated form type
const _formLevelErrors = (hydratedForm: FormData): StepFormErrors => {
  return getFormErrors(hydratedForm.stepType, hydratedForm)
}

// TODO type with hydrated form type
const _dynamicFieldFormErrors = (
  hydratedForm: FormData
): Array<ProfileFormError> => {
  return getProfileFormErrors(hydratedForm)
}

// TODO type with hydrated form type
export const _hasFieldLevelErrors = (hydratedForm: FormData): boolean => {
  for (const fieldName in hydratedForm) {
    const value = hydratedForm[fieldName]
    if (
      hydratedForm.stepType === 'thermocycler' &&
      fieldName === 'profileItemsById'
    ) {
      if (getProfileItemsHaveErrors(value)) {
        return true
      }
    } else {
      // TODO: fieldName includes id, stepType, etc... this is weird #3161
      const fieldErrors = getFieldErrors(fieldName, value)
      if (fieldErrors && fieldErrors.length > 0) {
        return true
      }
    }
  }
  return false
}

// TODO type with hydrated form type
export const _hasFormLevelErrors = (hydratedForm: FormData): boolean => {
  if (_formLevelErrors(hydratedForm).length > 0) return true

  if (
    hydratedForm.stepType === 'thermocycler' &&
    _dynamicFieldFormErrors(hydratedForm).length > 0
  ) {
    return true
  }
  return false
}

// TODO type with hydrated form type
export const _formHasErrors = (hydratedForm: FormData): boolean => {
  return _hasFieldLevelErrors(hydratedForm) || _hasFormLevelErrors(hydratedForm)
}

export const getInvariantContext: Selector<InvariantContext> = createSelector(
  getLabwareEntities,
  getModuleEntities,
  getPipetteEntities,
  (labwareEntities, moduleEntities, pipetteEntities) => ({
    labwareEntities,
    moduleEntities,
    pipetteEntities,
  })
)

// TODO(IL, 2020-03-24) type this as Selector<HydratedFormData>. See #3161
export const getHydratedUnsavedForm: Selector<any> = createSelector(
  getUnsavedForm,
  getInvariantContext,
  (unsavedForm, invariantContext) => {
    if (!unsavedForm) return null
    const hydratedForm = _getHydratedForm(unsavedForm, invariantContext)
    return hydratedForm
  }
)

export const getDynamicFieldFormErrorsForUnsavedForm: Selector<
  Array<ProfileFormError>
> = createSelector(
  getHydratedUnsavedForm,
  hydratedForm => {
    if (!hydratedForm) return []

    const errors = _dynamicFieldFormErrors(hydratedForm)
    return errors
  }
)

export const getFormLevelErrorsForUnsavedForm: Selector<StepFormErrors> = createSelector(
  getHydratedUnsavedForm,
  hydratedForm => {
    if (!hydratedForm) return []
    const errors = _formLevelErrors(hydratedForm)
    return errors
  }
)

export const getCurrentFormCanBeSaved: Selector<boolean> = createSelector(
  getHydratedUnsavedForm,
  hydratedForm => {
    if (!hydratedForm) return false
    return !_formHasErrors(hydratedForm)
  }
)

export const getArgsAndErrorsByStepId: Selector<StepArgsAndErrorsById> = createSelector(
  getOrderedSavedForms,
  getInvariantContext,
  (stepForms, contextualState) => {
    return reduce(
      stepForms,
      (acc, stepForm) => {
        const hydratedForm = _getHydratedForm(stepForm, contextualState)
        const errors = _formHasErrors(hydratedForm)
        const nextStepData = !errors
          ? { stepArgs: stepFormToArgs(hydratedForm) }
          : { errors, stepArgs: null }

        return {
          ...acc,
          [stepForm.id]: nextStepData,
        }
      },
      {}
    )
  }
)

export const getUnsavedFormIsPristineSetTempForm: Selector<boolean> = createSelector(
  getUnsavedForm,
  getCurrentFormIsPresaved,
  (unsavedForm, isPresaved) => {
    const isSetTempForm =
      unsavedForm?.stepType === 'temperature' &&
      unsavedForm?.setTemperature === 'true'
    return isPresaved && isSetTempForm
  }
)

export const getFormLevelWarningsForUnsavedForm: Selector<
  Array<FormWarning>
> = createSelector(
  getUnsavedForm,
  getInvariantContext,
  (unsavedForm, contextualState) => {
    if (!unsavedForm) return []
    const hydratedForm = _getHydratedForm(unsavedForm, contextualState)
    return getFormWarnings(unsavedForm.stepType, hydratedForm)
  }
)

export const getFormLevelWarningsPerStep: Selector<{
  [stepId: string]: Array<FormWarning>,
}> = createSelector(
  getSavedStepForms,
  getInvariantContext,
  (forms, contextualState) =>
    mapValues(forms, (form, stepId) => {
      if (!form) return []
      const hydratedForm = _getHydratedForm(form, contextualState)
      return getFormWarnings(form.stepType, hydratedForm)
    })
)
