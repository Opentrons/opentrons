// @flow
import type { ElementProps } from 'react'
import type { DeckSlot, DropdownOption, Mount } from '@opentrons/components'
import { typeof InstrumentGroup as InstrumentGroupProps } from '@opentrons/components'
import assert from 'assert'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import { createSelector } from 'reselect'
import {
  getPipetteNameSpecs,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import i18n from '../../localization'
import { INITIAL_DECK_SETUP_STEP_ID } from '../../constants'
import {
  generateNewForm,
  getFormWarnings,
  getFormErrors,
  stepFormToArgs,
} from '../../steplist/formLevel'
import { hydrateField, getFieldErrors } from '../../steplist/fieldLevel'
import { denormalizePipetteEntities } from '../utils'
import {
  selectors as labwareDefSelectors,
  type LabwareDefByDefId,
} from '../../labware-defs'

import type { FormWarning } from '../../steplist/formLevel'
import type { BaseState, Selector } from '../../types'
import type { FormData, StepIdType, StepType } from '../../form-types'
import type { LabwareTypeById } from '../../labware-ingred/types'
import type {
  StepArgsAndErrors,
  StepFormAndFieldErrors,
  StepItemData,
} from '../../steplist/types'
import type {
  InitialDeckSetup,
  NormalizedLabwareById,
  NormalizedLabware,
  LabwareOnDeck,
  LabwareEntity,
  LabwareEntities,
  PipetteEntities,
  PipetteOnDeck,
  FormPipettesByMount,
} from '../types'
import type { RootState } from '../reducers'
import type { InvariantContext } from '../../step-generation'

// TODO: Ian 2019-04-10 SHIM REMOVAL #3335
const FALLBACK_DEF = '54d2f430-d602-11e8-80b1-6965467d172c'

const rootSelector = (state: BaseState): RootState => state.stepForms

// NOTE Ian 2019-04-15: outside of this file, you probably only care about
// the labware entity in its denormalized representation, in which case you ought
// to use `getLabwareEntities` instead.
// `_getNormalizedLabwareById` is intended for uses tied to the NormalizedLabware type
const _getNormalizedLabwareById: Selector<NormalizedLabwareById> = createSelector(
  rootSelector,
  state => state.labwareInvariantProperties
)

// TODO: Ian 2019-04-15 remove this selector completely. DEPRECATED.
// Removal blocked by: BrowseLabwareModal/HighlightableLabware/LiquidPlacementModal/WellSelectionModal (all use SelectableLabware)
export const getLabwareTypesById: Selector<LabwareTypeById> = createSelector(
  _getNormalizedLabwareById,
  normalizedLabwareById =>
    mapValues(normalizedLabwareById, (l: NormalizedLabware) => l.type)
)

function _hydrateLabwareEntity(
  l: NormalizedLabware,
  labwareId: string,
  defs: LabwareDefByDefId
): LabwareEntity {
  return {
    ...l,
    id: labwareId,
    def: defs[l.type] || defs[FALLBACK_DEF],
  }
}

export const getLabwareEntities: Selector<LabwareEntities> = createSelector(
  _getNormalizedLabwareById,
  labwareDefSelectors.getLabwareDefsById,
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

export const getPipetteEntities: Selector<PipetteEntities> = createSelector(
  state => rootSelector(state).pipetteInvariantProperties,
  labwareDefSelectors.getLabwareDefsById,
  denormalizePipetteEntities
)

// Special version of `getPipetteEntities` selector for use in step-forms reducers
export const _getPipetteEntitiesRootState: RootState => PipetteEntities = createSelector(
  rs => rs.pipetteInvariantProperties,
  labwareDefSelectors._getLabwareDefsByIdRootState,
  denormalizePipetteEntities
)

export const getInitialDeckSetupStepForm = (state: BaseState) =>
  rootSelector(state).savedStepForms[INITIAL_DECK_SETUP_STEP_ID]

export const getInitialDeckSetup: Selector<InitialDeckSetup> = createSelector(
  getInitialDeckSetupStepForm,
  getLabwareEntities,
  getPipetteEntities,
  (initialSetupStep, labwareEntities, pipetteEntities) => {
    assert(
      initialSetupStep && initialSetupStep.stepType === 'manualIntervention',
      'expected initial deck setup step to be "manualIntervention" step'
    )
    const labwareLocations =
      (initialSetupStep && initialSetupStep.labwareLocationUpdate) || {}
    const pipetteLocations =
      (initialSetupStep && initialSetupStep.pipetteLocationUpdate) || {}
    return {
      labware: mapValues(
        labwareLocations,
        (slot: DeckSlot, labwareId: string): LabwareOnDeck => {
          return { slot, ...labwareEntities[labwareId] }
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
)

export const getPermittedTipracks: Selector<Array<string>> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    reduce(
      initialDeckSetup.pipettes,
      (acc: Array<string>, pipette: PipetteOnDeck) => {
        return pipette.tiprackModel ? [...acc, pipette.tiprackModel] : acc
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

        const pipetteForInstrumentGroup = {
          mount: pipetteOnDeck.mount,
          channels: pipetteSpec ? pipetteSpec.channels : undefined,
          description: _getPipetteDisplayName(pipetteOnDeck.name),
          isDisabled: false,
          tiprackModel: getLabwareDisplayName(tiprackDef),
          tiprack: { model: pipetteOnDeck.tiprackModel },
        }

        return {
          ...acc,
          [pipetteOnDeck.mount]: pipetteForInstrumentGroup,
        }
      },
      {}
    )
)

export const getPipettesForEditPipetteForm: Selector<FormPipettesByMount> = createSelector(
  getInitialDeckSetup,
  initialDeckSetup =>
    reduce(
      initialDeckSetup.pipettes,
      (
        acc: FormPipettesByMount,
        pipetteOnDeck: PipetteOnDeck,
        id
      ): FormPipettesByMount => {
        const pipetteSpec = pipetteOnDeck.spec
        const tiprackDef = pipetteOnDeck.tiprackLabwareDef

        if (!pipetteSpec || !tiprackDef) return acc

        const pipetteForInstrumentGroup = {
          pipetteName: pipetteOnDeck.name,
          tiprackModel: getLabwareDisplayName(tiprackDef),
        }

        return {
          ...acc,
          [pipetteOnDeck.mount]: pipetteForInstrumentGroup,
        }
      },
      {
        left: { pipetteName: null, tiprackModel: null },
        right: { pipetteName: null, tiprackModel: null },
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

export const getSavedStepForms: Selector<*> = createSelector(
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

// TODO: Ian 2019-01-25 type with hydrated form type
function _getHydratedForm(
  rawForm: FormData,
  invariantContext: InvariantContext
) {
  const hydratedForm = mapValues(rawForm, (value, name) =>
    hydrateField(invariantContext, name, value)
  )
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
  getPipetteEntities,
  (labwareEntities, pipetteEntities) => ({ labwareEntities, pipetteEntities })
)

export const getUnsavedFormErrors: Selector<?StepFormAndFieldErrors> = createSelector(
  getUnsavedForm,
  getInvariantContext,
  (unsavedForm, contextualState) => {
    if (!unsavedForm) return null
    const hydratedForm = _getHydratedForm(unsavedForm, contextualState)
    const errors = _getFormAndFieldErrorsFromHydratedForm(hydratedForm)
    return errors
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
  return createSelector(
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
export const getIsNewStepForm = createSelector(
  getUnsavedForm,
  getSavedStepForms,
  (formData, savedForms) =>
    formData && formData.id != null ? !savedForms[formData.id] : true
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

  return generateNewForm({
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
