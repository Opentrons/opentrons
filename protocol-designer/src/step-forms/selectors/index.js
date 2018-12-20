// @flow
import assert from 'assert'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import some from 'lodash/some'
import {createSelector} from 'reselect'
import {getPipetteNameSpecs, getLabware} from '@opentrons/shared-data'
import {INITIAL_DECK_SETUP_STEP_ID} from '../../constants'
import {
  generateNewForm,
  getFormWarnings,
  getFormErrors,
  stepFormToArgs,
} from '../../steplist/formLevel'
import {
  hydrateField,
  getFieldErrors,
} from '../../steplist/fieldLevel'

import type {ElementProps} from 'react'
import type {DropdownOption, Mount} from '@opentrons/components'
import {typeof InstrumentGroup as InstrumentGroupProps} from '@opentrons/components'

import type {
  FormError,
  FormWarning,
} from '../../steplist/formLevel'

import type {
  StepArgsAndErrors,
  StepFormAndFieldErrors,
  StepItemData,
} from '../../steplist/types'
import type {InitialDeckSetup, LabwareEntities, PipetteOnDeck, PipetteEntities} from '../types'
import type {RootState} from '../reducers'
import type {BaseState, Selector} from '../../types'
import type {FormData, StepIdType, StepType} from '../../form-types'
import type {FormattedPipette} from '../../pipettes/types'
// TODO: Ian 2018-12-13 make selectors

// TODO IMMEDIATELY this is copied from steplist, put it somewhere common
const NO_SAVED_FORM_ERROR = 'NO_SAVED_FORM_ERROR'

const rootSelector = (state: BaseState): RootState => state.stepForms

// TODO: Ian 2018-12-14 type properly
export const getLabwareInvariantProperties: Selector<LabwareEntities> = createSelector(
  rootSelector,
  (state) => state.labwareInvariantProperties
)

// TODO: Ian 2018-12-14 type properly
export const getPipetteInvariantProperties: Selector<PipetteEntities> = createSelector(
  rootSelector,
  (state) => state.pipetteInvariantProperties
)

// TODO: Ian 2018-12-14 type properly
export const getInitialDeckSetup: Selector<InitialDeckSetup> = createSelector(
  rootSelector,
  getLabwareInvariantProperties,
  getPipetteInvariantProperties,
  (state, labwareInvariantProperties, pipetteInvariantProperties) => {
    const initialSetupStep = state.savedStepForms[INITIAL_DECK_SETUP_STEP_ID]
    assert(
      initialSetupStep && initialSetupStep.stepType === 'manualIntervention',
      'expected initial deck setup step to be "manualIntervention" step')
    const labwareLocations = (initialSetupStep && initialSetupStep.labwareLocationUpdate) || {}
    const pipetteLocations = (initialSetupStep && initialSetupStep.pipetteLocationUpdate) || {}
    return {
      labware: mapValues(labwareLocations, (slot: string, labwareId: string) => {
        return {slot, ...labwareInvariantProperties[labwareId]}
      }),
      pipettes: mapValues(pipetteLocations, (mount: Mount, pipetteId: string) => {
        return {mount, ...pipetteInvariantProperties[pipetteId]}
      }),
    }
  }
)

export const getPermittedTipracks: Selector<Array<string>> = createSelector(
  getInitialDeckSetup,
  (initialDeckSetup) =>
    reduce(initialDeckSetup.pipettes, (acc: Array<string>, pipette: PipetteOnDeck) => {
      return (pipette.tiprackModel)
        ? [...acc, pipette.tiprackModel]
        : acc
    }, [])
)

function _getPipetteDisplayName (name: string): string {
  const pipetteSpecs = getPipetteNameSpecs(name)
  if (!pipetteSpecs) return 'Unknown Pipette'
  return pipetteSpecs.displayName
}

// TODO: Ian 2018-12-20 make this `getEquippedPipetteOptionsForStepId`, so it tells you
// equipped pipettes per step id instead of always using initial deck setup
// (for when we support multiple deck setup steps)
export const getEquippedPipetteOptions: Selector<Array<DropdownOption>> = createSelector(
  getInitialDeckSetup,
  (initialDeckSetup) =>
    reduce(initialDeckSetup.pipettes, (acc: Array<DropdownOption>, pipette: PipetteOnDeck, id: string) => {
      const nextOption = {
        name: _getPipetteDisplayName(pipette.name),
        value: id,
      }
      return [...acc, nextOption]
    }, [])
)

// Formats pipette data specifically for file page InstrumentGroup component
type PipettesForInstrumentGroup = ElementProps<InstrumentGroupProps>
export const getPipettesForInstrumentGroup: Selector<PipettesForInstrumentGroup> = createSelector(
  getInitialDeckSetup,
  (initialDeckSetup) => reduce(initialDeckSetup.pipettes, (acc: PipettesForInstrumentGroup, pipetteOnDeck: PipetteOnDeck, pipetteId) => {
    const pipetteSpec = getPipetteNameSpecs(pipetteOnDeck.name)
    const tiprackSpec = getLabware(pipetteOnDeck.tiprackModel)

    const pipetteForInstrumentGroup = {
      mount: pipetteOnDeck.mount,
      channels: pipetteSpec ? pipetteSpec.channels : undefined,
      description: _getPipetteDisplayName(pipetteOnDeck.name),
      isDisabled: false,
      tiprackModel: tiprackSpec ? `${tiprackSpec.metadata.tipVolume || '?'} uL` : undefined,
      tiprack: {model: pipetteOnDeck.tiprackModel},
    }

    return {
      ...acc,
      [pipetteOnDeck.mount]: pipetteForInstrumentGroup,
    }
  }, {})
)

// TODO: Ian 2018-12-20 this is very similar to `getPipettesForInstrumentGroup`,
// can we merge the 2 similar return types here and in the 2 components that use these?
type EditPipetteFieldsByMount = {left: ?FormattedPipette, right: ?FormattedPipette}
export const getPipettesForEditPipetteForm: Selector<EditPipetteFieldsByMount> = createSelector(
  getInitialDeckSetup,
  (initialDeckSetup) => reduce(initialDeckSetup.pipettes, (acc: EditPipetteFieldsByMount, pipetteOnDeck: PipetteOnDeck, id): EditPipetteFieldsByMount => {
    const pipetteSpec = getPipetteNameSpecs(pipetteOnDeck.name)
    const tiprackSpec = getLabware(pipetteOnDeck.tiprackModel)

    if (!pipetteSpec) return acc

    const pipetteForInstrumentGroup = {
      id: id,
      mount: pipetteOnDeck.mount,
      model: pipetteOnDeck.name,
      maxVolume: pipetteSpec.maxVolume,
      channels: pipetteSpec.channels,
      description: _getPipetteDisplayName(pipetteOnDeck.name),
      isDisabled: false,
      tiprackModel: tiprackSpec ? `${tiprackSpec.metadata.tipVolume || '?'} uL` : undefined,
      tiprack: {model: pipetteOnDeck.tiprackModel},
    }

    return {
      ...acc,
      [pipetteOnDeck.mount]: pipetteForInstrumentGroup,
    }
  }, {left: null, right: null})
)

export const getUnsavedForm: Selector<?FormData> = createSelector(
  rootSelector,
  (state) => state.unsavedForm
)

export const getOrderedSteps: Selector<Array<StepIdType>> = createSelector(
  rootSelector,
  (state) => state.orderedSteps
)

export const getSavedStepForms: Selector<*> = createSelector(
  rootSelector,
  (state) => state.savedStepForms
)

const getOrderedSavedForms: Selector<Array<FormData>> = createSelector(
  getOrderedSteps,
  getSavedStepForms,
  (orderedSteps, savedStepForms) => {
    return orderedSteps
      .map(stepId => savedStepForms[stepId])
      .filter(form => form && form.id != null) // NOTE: for old protocols where stepId could === 0, need to do != null here
  }
)

// TODO type with hydrated form type
const _getAllErrorsFromHydratedForm = (hydratedForm: FormData): StepFormAndFieldErrors => {
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
    errors = {...errors, form: formErrors}
  }

  return errors
}

export const getHydratedUnsavedFormErrors: Selector<?StepFormAndFieldErrors> = createSelector(
  getUnsavedForm,
  getLabwareInvariantProperties,
  getPipetteInvariantProperties,
  (unsavedForm, labware, pipettes) => {
    if (!unsavedForm) return null
    const contextualState = {labware, pipettes}
    const hydratedForm = mapValues(unsavedForm, (value, name) => (
      hydrateField(contextualState, name, value)
    ))

    const errors = _getAllErrorsFromHydratedForm(hydratedForm)
    return errors
  }
)

export const getArgsAndErrorsByStepId: Selector<{[StepIdType]: StepArgsAndErrors}> = createSelector(
  getOrderedSavedForms,
  getLabwareInvariantProperties,
  getPipetteInvariantProperties,
  (stepForms, labware, pipettes) => {
    const contextualState = {labware, pipettes}
    return reduce(stepForms, (acc, stepForm) => {
      const hydratedForm = mapValues(stepForm, (value, name) => (
        hydrateField(contextualState, name, value)
      ))
      const errors = _getAllErrorsFromHydratedForm(hydratedForm)
      const nextStepData = isEmpty(errors)
        ? {stepArgs: stepFormToArgs(hydratedForm)}
        : {errors, stepArgs: null}

      return {
        ...acc,
        [stepForm.id]: nextStepData,
      }
    }, {})
  }
)

export const getFormAndFieldErrorsByStepId: Selector<{[StepIdType]: StepFormAndFieldErrors}> = createSelector(
  getArgsAndErrorsByStepId,
  (stepsArgsAndErrors) => (
    mapValues(stepsArgsAndErrors, (argsAndErrors) => {
      const formErrors = argsAndErrors.errors && argsAndErrors.errors.form
      if (
        formErrors &&
        some(formErrors, error => error.title === NO_SAVED_FORM_ERROR)
      ) {
        return {}
      }
      return argsAndErrors.errors
    })
  )
)

export const getIsNewStepForm = createSelector(
  getUnsavedForm,
  getSavedStepForms,
  (formData, savedForms) =>
    Boolean(formData && formData.id != null && !savedForms[formData.id])
)

// TODO: Ian 2018-12-17 rename for clarity: it's for unsaved form, not saved forms
export const getFormLevelWarnings: Selector<Array<FormWarning>> = createSelector(
  getUnsavedForm,
  getLabwareInvariantProperties,
  getPipetteInvariantProperties,
  (unsavedFormData, labware, pipettes) => {
    if (!unsavedFormData) return []
    const contextualState = {labware, pipettes}
    const {id, stepType, ...fields} = unsavedFormData
    const hydratedFields = mapValues(fields, (value, name) => hydrateField(contextualState, name, value))
    return getFormWarnings(stepType, hydratedFields)
  }
)

export const getFormLevelErrors: Selector<Array<FormError>> = createSelector(
  getUnsavedForm,
  getLabwareInvariantProperties,
  getPipetteInvariantProperties,
  (unsavedFormData, labware, pipettes) => {
    if (!unsavedFormData) return []
    const {id, stepType, ...fields} = unsavedFormData
    const contextualState = {labware, pipettes}
    const hydratedFields = mapValues(fields, (value, name) => hydrateField(contextualState, name, value))
    return getFormErrors(stepType, hydratedFields)
  }
)

// TODO: Ian 2018-12-19 this is DEPRECATED, should be removed once legacySteps reducer is removed
const getSteps = (state: BaseState) => rootSelector(state).legacySteps
export function _getStepFormData (state: BaseState, stepId: StepIdType, newStepType?: StepType): ?FormData {
  const existingStep = getSavedStepForms(state)[stepId]

  if (existingStep) {
    return existingStep
  }

  const steps = getSteps(state)
  const stepTypeFromStepReducer = steps[stepId] && steps[stepId].stepType
  const stepType = newStepType || stepTypeFromStepReducer

  if (!stepType) {
    console.error(`New step with id "${stepId}" was added with no stepType, could not generate form`)
    return null
  }

  return generateNewForm({
    stepId,
    stepType: stepType,
  })
}

// TODO: Ian 2018-12-19 this is DEPRECATED, should be removed once legacySteps reducer is removed
export const getAllSteps: Selector<{[stepId: StepIdType]: StepItemData}> = createSelector(
  getSteps,
  getSavedStepForms,
  (steps, savedForms) => {
    return mapValues(
      steps,
      (step: StepItemData, id: StepIdType): StepItemData => {
        const savedForm = (savedForms && savedForms[id]) || null

        // Assign the step title
        let title

        if (savedForm && savedForm['step-name']) {
          title = savedForm['step-name']
        } else {
          title = step.stepType
        }

        return {
          ...steps[id],
          formData: savedForm,
          title,
          description: savedForm ? savedForm['step-details'] : null,
        }
      }
    )
  }
)
