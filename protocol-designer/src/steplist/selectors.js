// @flow
import {createSelector} from 'reselect'
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import isEmpty from 'lodash/isEmpty'
import each from 'lodash/each'
import some from 'lodash/some'

import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {selectors as pipetteSelectors} from '../pipettes'
import {getFormWarnings, getFormErrors, stepFormToArgs} from './formLevel'
import type {FormError, FormWarning} from './formLevel'
import {hydrateField, getFieldErrors} from './fieldLevel'
import type {RootState, OrderedStepsState} from './reducers'
import type {BaseState, Selector} from '../types'

import type {
  StepItemData,
  StepFormAndFieldErrors,
  StepArgsAndErrors,
  StepFormContextualState,
} from './types'

import type {FormData, StepIdType} from '../form-types'

const NO_SAVED_FORM_ERROR = 'NO_SAVED_FORM_ERROR'

// TODO Ian 2018-01-19 Rethink the hard-coded 'steplist' key in Redux root
const rootSelector = (state: BaseState): RootState => state.steplist

// ======= Selectors ===============================================

const getUnsavedForm: Selector<?FormData> = createSelector(rootSelector, (state: RootState) => state.unsavedForm)

const getStepFormContextualState: Selector<StepFormContextualState> = createSelector(
  labwareIngredSelectors.rootSelector,
  pipetteSelectors.rootSelector,
  (labwareIngred, pipettes) => ({
    labwareIngred,
    pipettes,
  })
)

const getHydratedUnsavedForm: Selector<?FormData> = createSelector(
  getUnsavedForm,
  getStepFormContextualState,
  (unsavedForm, contextualState) => (
    unsavedForm && mapValues(unsavedForm, (value, name) => (
      hydrateField(contextualState, name, value)
    ))
  )
)

// TODO: BC 2018-12-17 remove when steps branch is sunsetted
const getSteps = createSelector(rootSelector, (state: RootState) => state.steps)

const getOrderedSteps: Selector<OrderedStepsState> = createSelector(
  rootSelector,
  (state: RootState) => state.orderedSteps
)

/** This is just a simple selector, but has some debugging logic. TODO Ian 2018-03-20: use assert here */
const getSavedForms: Selector<{[StepIdType]: FormData}> = createSelector(
  getSteps,
  getOrderedSteps,
  (state: BaseState) => rootSelector(state).savedStepForms,
  (steps, orderedSteps, savedStepForms) => {
    orderedSteps.forEach(stepId => {
      if (!steps[stepId]) {
        console.error(`Encountered an undefined step: ${stepId}`)
      }
    })

    return savedStepForms
  }
)

const getHydratedSavedForms: Selector<{[StepIdType]: FormData}> = createSelector(
  getSavedForms,
  getStepFormContextualState,
  (savedForms, contextualState) => (
    mapValues(savedForms, (savedForm) => (
      mapValues(savedForm, (value, name) => (
        hydrateField(contextualState, name, value)
      ))
    ))
  )
)

// TODO type with hydrated form type
const getAllErrorsFromHydratedForm = (hydratedForm: FormData): StepFormAndFieldErrors => {
  let errors: StepFormAndFieldErrors = {}

  each(hydratedForm, (value, fieldName) => {
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

// TODO Brian 2018-10-29 separate out getErrors and getStepArgs
const getArgsAndErrorsByStepId: Selector<{[StepIdType]: StepArgsAndErrors}> = createSelector(
  getSteps,
  getHydratedSavedForms,
  getOrderedSteps,
  (steps, savedStepForms, orderedSteps) => {
    return reduce(orderedSteps, (acc, stepId) => {
      let nextStepData
      if (steps[stepId] && savedStepForms[stepId]) {
        const savedForm = savedStepForms[stepId]

        const errors = getAllErrorsFromHydratedForm(savedForm)

        nextStepData = isEmpty(errors)
          ? {stepArgs: stepFormToArgs(savedForm)}
          : {errors, stepArgs: null}
      } else {
        // NOTE: usually, stepFormData is undefined here b/c there's no saved step form for it:
        nextStepData = {
          errors: {form: [{title: NO_SAVED_FORM_ERROR}]},
          stepArgs: null,
        }
      } // TODO Ian 2018-03-20 revisit "no saved form for step"
      return {
        ...acc,
        [stepId]: nextStepData,
      }
    }, {})
  }
)

// TODO: BC 2018-10-30 after separation of getStepArgs and getStepErrors
// , move the NO_SAVED_FORM_ERROR into a separate wrapping selector
// it is currently there to keep the step item error state from appearing
// before you've saved the form once
const getFormAndFieldErrorsByStepId: Selector<{[StepIdType]: StepFormAndFieldErrors}> = createSelector(
  getArgsAndErrorsByStepId,
  (stepsArgsAndErrors) => (
    mapValues(stepsArgsAndErrors, (argsAndErrors) => {
      const formErrors = argsAndErrors.errors && argsAndErrors.errors.form
      if (formErrors && some(formErrors, error => error.title === NO_SAVED_FORM_ERROR)) return {}
      return argsAndErrors.errors
    })
  )
)

const getIsNewStepForm = createSelector(
  getUnsavedForm,
  getSavedForms,
  (formData, savedForms) => !!(formData && formData.id != null && !savedForms[formData.id])
)

const getFormLevelWarnings: Selector<Array<FormWarning>> = createSelector(
  getUnsavedForm,
  getStepFormContextualState,
  (unsavedFormData, contextualState) => {
    if (!unsavedFormData) return []
    const {id, stepType, ...fields} = unsavedFormData
    const hydratedFields = mapValues(fields, (value, name) => hydrateField(contextualState, name, value))
    return getFormWarnings(stepType, hydratedFields)
  }
)

const getFormLevelErrors: Selector<Array<FormError>> = createSelector(
  getUnsavedForm,
  getStepFormContextualState,
  (unsavedFormData, contextualState) => {
    if (!unsavedFormData) return []
    const {id, stepType, ...fields} = unsavedFormData
    const hydratedFields = mapValues(fields, (value, name) => hydrateField(contextualState, name, value))
    return getFormErrors(stepType, hydratedFields)
  }
)

const getAllSteps: Selector<{[stepId: StepIdType]: StepItemData}> = createSelector(
  getSteps,
  getSavedForms,
  labwareIngredSelectors.getLabwareById,
  (steps, savedForms, labware) => {
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

export default {
  rootSelector,

  getAllSteps,
  getFormAndFieldErrorsByStepId,

  getOrderedSteps,
  getUnsavedForm,
  getHydratedUnsavedForm,
  getArgsAndErrorsByStepId,
  getIsNewStepForm,
  getFormLevelWarnings,
  getFormLevelErrors,
  getAllErrorsFromHydratedForm,

  // NOTE: these are exposed only for substeps/selectors.js
  getSteps,
  getSavedForms,
}
