// @flow
import assert from 'assert'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import some from 'lodash/some'
import {createSelector} from 'reselect'
import {INITIAL_DECK_SETUP_STEP_ID} from '../../constants'
import {
  getFormWarnings,
  getFormErrors,
  stepFormToArgs,
} from '../../steplist/formLevel'
import {
  hydrateField,
  getFieldErrors,
} from '../../steplist/fieldLevel'

import type {Mount} from '@opentrons/components'
import type {
  FormError,
  FormWarning,
} from '../../steplist/formLevel'

import type {
  // StepItemData,
  // FormSectionState,
  // SubstepIdentifier,
  // TerminalItemId,
  StepFormAndFieldErrors,
  StepArgsAndErrors,
  // StepFormContextualState,
} from '../../steplist/types'
import type {InitialDeckSetup} from '../types'
import type {RootState} from '../reducers'
import type {BaseState, Selector} from '../../types'
import type {FormData, StepIdType} from '../../form-types'
// TODO: Ian 2018-12-13 make selectors

// TODO IMMEDIATELY this is copied from steplist, put it somewhere common
const NO_SAVED_FORM_ERROR = 'NO_SAVED_FORM_ERROR'

const rootSelector = (state: BaseState): RootState => state.stepForms

// TODO: Ian 2018-12-14 type properly
export const getLabwareInvariantProperties: Selector<*> = createSelector(
  rootSelector,
  (state) => state.labwareInvariantProperties
)

// TODO: Ian 2018-12-14 type properly
export const getPipetteInvariantProperties: Selector<*> = createSelector(
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

export const getUnsavedForm: Selector<?FormData> = createSelector(
  rootSelector,
  (state) => state.unsavedForm
)

export const getOrderedSteps: Selector<Array<StepIdType>> = createSelector(
  rootSelector,
  (state) => state.orderedSteps
)

const getSavedStepForms: Selector<*> = createSelector(
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
