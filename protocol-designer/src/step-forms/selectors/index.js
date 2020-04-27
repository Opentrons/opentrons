// @flow
import type { ElementProps } from 'react'
import assert from 'assert'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
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
import { i18n } from '../../localization'
import {
  INITIAL_DECK_SETUP_STEP_ID,
  TEMPERATURE_DEACTIVATED,
} from '../../constants'
import {
  createBlankForm,
  getFormWarnings,
  getFormErrors,
  stepFormToArgs,
} from '../../steplist/formLevel'
import { hydrateField, getFieldErrors } from '../../steplist/fieldLevel'
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
import type { FormData, StepIdType, StepType } from '../../form-types'
import type {
  StepArgsAndErrors,
  StepFormAndFieldErrors,
  StepItemData,
} from '../../steplist/types'
import type { CommandCreatorArgs } from '../../step-generation/types'
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
import type { RootState, SavedStepFormState } from '../reducers'
import type { InvariantContext } from '../../step-generation'

const rootSelector = (state: BaseState): RootState => state.stepForms

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

// TODO: BC: 2019-05-06 currently not being used, but should be used as the interface
// for presenting labware locations on the deck for a given step
export const getLabwareLocationsForStep = (
  state: BaseState,
  stepId: StepIdType = INITIAL_DECK_SETUP_STEP_ID
) => {
  const { orderedStepIds, savedStepForms } = rootSelector(state)
  const allOrderedStepIds = [INITIAL_DECK_SETUP_STEP_ID, ...orderedStepIds]
  const relevantStepIds = allOrderedStepIds.slice(
    0,
    allOrderedStepIds.indexOf(stepId) + 1
  )
  return relevantStepIds.reduce((acc, stepId) => {
    const { labwareLocationUpdate } = savedStepForms[stepId]
    if (labwareLocationUpdate) return { ...acc, ...labwareLocationUpdate }
    return acc
  }, {})
}

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
  // Consider nesting all additional fields under 'hydrated' key,
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
const _getFormAndFieldErrorsFromHydratedForm = (
  hydratedForm: FormData
): StepFormAndFieldErrors => {
  let errors: StepFormAndFieldErrors = {}

  forEach(hydratedForm, (value, fieldName) => {
    const fieldErrors = getFieldErrors(fieldName, value)
    if (fieldErrors && fieldErrors.length > 0) {
      errors = {
        ...errors,
        field: {
          ...errors.field,
          [fieldName]: fieldErrors,
        },
      }
    }
  })
  const formErrors = getFormErrors(hydratedForm.stepType, hydratedForm)
  if (formErrors && formErrors.length > 0) {
    errors = { ...errors, form: formErrors }
  }

  return errors
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

export const getUnsavedFormErrors: Selector<?StepFormAndFieldErrors> = createSelector(
  getHydratedUnsavedForm,
  hydratedForm => {
    if (!hydratedForm) return null
    const errors = _getFormAndFieldErrorsFromHydratedForm(hydratedForm)
    return errors
  }
)

// TODO: BC: 2018-10-26 remove this when we decide to not block save
export const getCurrentFormCanBeSaved: Selector<boolean> = createSelector(
  getUnsavedFormErrors,
  formErrors => {
    return Boolean(formErrors && isEmpty(formErrors))
  }
)

// TODO: Brian&Ian 2019-04-02 this is TEMPORARY, should be removed once legacySteps reducer is removed
const getLegacyStepWithId = (
  state: BaseState,
  props: { stepId: StepIdType }
) => {
  return state.stepForms.legacySteps[props.stepId]
}

const getStepFormWithId = (state: BaseState, props: { stepId: StepIdType }) => {
  return state.stepForms.savedStepForms[props.stepId]
}

export const makeGetArgsAndErrorsWithId = () => {
  return createSelector<
    BaseState,
    { stepId: StepIdType },
    { stepArgs: CommandCreatorArgs | null, errors?: StepFormAndFieldErrors },
    _,
    _
  >(
    getStepFormWithId,
    getInvariantContext,
    (stepForm, contextualState) => {
      const hydratedForm = _getHydratedForm(stepForm, contextualState)
      const errors = _getFormAndFieldErrorsFromHydratedForm(hydratedForm)
      return isEmpty(errors)
        ? { stepArgs: stepFormToArgs(hydratedForm) }
        : { errors, stepArgs: null }
    }
  )
}

// TODO: Brian&Ian 2019-04-02 this is TEMPORARY, should be removed once legacySteps reducer is removed
// only need it because stepType should exist evergreen outside of legacySteps but doesn't yet
export const makeGetStepWithId = () => {
  // $FlowFixMe: selector is untyped. hiding error due to TODO above
  return createSelector(
    getStepFormWithId,
    getLegacyStepWithId,
    (stepForm, legacyStep) => {
      return {
        ...legacyStep,
        formData: stepForm,
        title: stepForm
          ? stepForm.stepName
          : i18n.t(`application.stepType.${legacyStep.stepType}`),
        description: stepForm ? stepForm.stepDetails : null,
      }
    }
  )
}

export const getArgsAndErrorsByStepId: Selector<{
  [StepIdType]: StepArgsAndErrors,
}> = createSelector(
  getOrderedSavedForms,
  getInvariantContext,
  (stepForms, contextualState) => {
    return reduce(
      stepForms,
      (acc, stepForm) => {
        const hydratedForm = _getHydratedForm(stepForm, contextualState)
        const errors = _getFormAndFieldErrorsFromHydratedForm(hydratedForm)
        const nextStepData = isEmpty(errors)
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

// TODO: BC&IL 2019-04-02 this is being recomputed every time any field in unsaved forms is changed
// this should only be computed once when a form is opened
export const getIsNewStepForm: Selector<boolean> = createSelector(
  getUnsavedForm,
  getSavedStepForms,
  (formData, savedForms) =>
    formData && formData.id != null ? !savedForms[formData.id] : true
)

export const getUnsavedFormIsPristineSetTempForm: Selector<boolean> = createSelector(
  getUnsavedForm,
  getIsNewStepForm,
  (unsavedForm, isNewStepForm) => {
    const isSetTempForm =
      unsavedForm?.stepType === 'temperature' &&
      unsavedForm?.setTemperature === 'true'
    return isNewStepForm && isSetTempForm
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

// TODO: Ian 2018-12-19 this is DEPRECATED, should be removed once legacySteps reducer is removed
const getSteps = (state: BaseState) => rootSelector(state).legacySteps
export function _getStepFormData(
  state: BaseState,
  stepId: StepIdType,
  newStepType?: StepType
): ?FormData {
  const existingStep = getSavedStepForms(state)[stepId]

  if (existingStep) {
    return existingStep
  }

  const steps = getSteps(state)
  const stepTypeFromStepReducer = steps[stepId] && steps[stepId].stepType
  const stepType = newStepType || stepTypeFromStepReducer

  if (!stepType) {
    console.error(
      `New step with id "${stepId}" was added with no stepType, could not generate form`
    )
    return null
  }

  return createBlankForm({
    stepId,
    stepType: stepType,
  })
}

// TODO: Ian 2018-12-19 this is DEPRECATED, should be removed once legacySteps reducer is removed
export const getAllSteps: Selector<{
  [stepId: StepIdType]: StepItemData,
}> = createSelector(
  getSteps,
  getSavedStepForms,
  (steps, savedForms) => {
    return mapValues(
      steps,
      (step: StepItemData, id: StepIdType): StepItemData => {
        const savedForm = (savedForms && savedForms[id]) || null
        return {
          ...steps[id],
          formData: savedForm,
          title: savedForm
            ? savedForm.stepName
            : i18n.t(`application.stepType.${step.stepType}`),
          description: savedForm ? savedForm.stepDetails : null,
        }
      }
    )
  }
)
