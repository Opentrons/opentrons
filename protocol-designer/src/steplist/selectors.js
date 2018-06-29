// @flow
import {createSelector} from 'reselect'
import reduce from 'lodash/reduce'
import mapValues from 'lodash/mapValues'
import max from 'lodash/max'

import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {getFormWarnings} from './formLevel'
import {hydrateField} from './fieldLevel'

import {END_STEP} from './types'
import type {BaseState, Selector} from '../types'

import type { StepItemData, FormSectionState, SubstepIdentifier } from './types'
import type { FormData, BlankForm, StepIdType } from '../form-types'

import {
  type ValidFormAndErrors,
  generateNewForm,
  validateAndProcessForm,
  formHasErrors
} from './formProcessing'

// TODO Ian 2018-01-19 Rethink the hard-coded 'steplist' key in Redux root
const rootSelector = (state: BaseState): RootState => state.steplist

// ======= Selectors ===============================================

const getUnsavedForm = createSelector(
  rootSelector,
  (state: RootState) => state.unsavedForm
)
// TODO Ian 2018-02-08 rename formData to something like getUnsavedForm or unsavedFormFields
// NOTE: DEPRECATED use getUnsavedForm instead
const formData = getUnsavedForm

const formModalData = createSelector(
  rootSelector,
  (state: RootState) => state.unsavedFormModal
)

const selectedStepId = createSelector(
  rootSelector,
  (state: RootState) => state.selectedStep
)

const hoveredStepId = createSelector(
  rootSelector,
  (state: RootState) => state.hoveredStep
)

const getHoveredSubstep: Selector<SubstepIdentifier> = createSelector(
  rootSelector,
  (state: RootState) => state.hoveredSubstep
)

const hoveredOrSelectedStepId: Selector<StepIdType | typeof END_STEP | null> = createSelector(
  hoveredStepId,
  selectedStepId,
  (hoveredId, selectedId) => hoveredId !== null
    ? hoveredId
    : selectedId
)

const getSteps = createSelector(
  rootSelector,
  (state: RootState) => state.steps
)

const getCollapsedSteps = createSelector(
  rootSelector,
  (state: RootState) => state.collapsedSteps
)

const orderedStepsSelector: Selector<OrderedStepsState> = createSelector(
  rootSelector,
  (state: RootState) => state.orderedSteps
)

/** This is just a simple selector, but has some debugging logic. TODO Ian 2018-03-20: use assert here */
const getSavedForms: Selector<{[StepIdType]: FormData}> = createSelector(
  getSteps,
  orderedStepsSelector,
  (state: BaseState) => rootSelector(state).savedStepForms,
  (_steps, _orderedSteps, _savedStepForms) => {
    if (_orderedSteps.length === 0) {
      // No steps -- since initial Deck Setup step exists in default Redux state,
      // this probably should never happen
      console.warn('validatedForms called with no steps in "orderedSteps"')
      return {}
    }

    if (_steps[0].stepType !== 'deck-setup') {
      console.error('Error: expected deck-setup to be first step.', _orderedSteps)
    }

    _orderedSteps.slice(1).forEach(stepId => {
      if (!_steps[stepId]) {
        console.error(`Encountered an undefined step: ${stepId}`)
      } else if (_steps[stepId].stepType === 'deck-setup') {
        console.error('Encountered a deck-setup step which was not the first step in orderedSteps. This is not supported yet.')
      }
    })

    return _savedStepForms
  }
)

// TODO Ian 2018-02-14 rename validatedForms -> validatedSteps, since not all steps have forms (eg deck setup steps)
const validatedForms: Selector<{[StepIdType]: ValidFormAndErrors}> = createSelector(
  getSteps,
  getSavedForms,
  orderedStepsSelector,
  (_steps, _savedStepForms, _orderedSteps) => {
    const orderedNonDeckSteps = _orderedSteps.slice(1)

    return reduce(orderedNonDeckSteps, (acc, stepId) => {
      const nextStepData = (_steps[stepId] && _savedStepForms[stepId])
        ? validateAndProcessForm(_savedStepForms[stepId])
        // NOTE: usually, stepFormData is undefined here b/c there's no saved step form for it:
        : {
          errors: {'form': ['no saved form for step ' + stepId]},
          validatedForm: null
        } // TODO Ian 2018-03-20 revisit "no saved form for step"

      return {
        ...acc,
        [stepId]: nextStepData
      }
    }, {})
  }
)

const isNewStepForm = createSelector(
  formData,
  getSavedForms,
  (formData, savedForms) => !!(formData && formData.id && !savedForms[formData.id])
)

/** True if app is in Deck Setup Mode. */
const deckSetupMode: Selector<boolean> = createSelector(
  getSteps,
  hoveredOrSelectedStepId,
  (steps, selectedStepId) => (selectedStepId !== null && selectedStepId !== '__end__' && steps[selectedStepId])
    ? steps[selectedStepId].stepType === 'deck-setup'
    : false
)

/** Array of labware (labwareId's) involved in hovered Step, or [] */
const hoveredStepLabware: Selector<Array<string>> = createSelector(
  validatedForms,
  hoveredStepId,
  (_forms, _hoveredStep) => {
    const blank = []
    if (typeof _hoveredStep !== 'number' || !_forms[_hoveredStep]) {
      return blank
    }

    const stepForm = _forms[_hoveredStep].validatedForm

    if (!stepForm) {
      return blank
    }

    if (
      stepForm.stepType === 'consolidate' ||
      stepForm.stepType === 'distribute' ||
      stepForm.stepType === 'transfer'
    ) {
      // source and dest labware
      const src = stepForm.sourceLabware
      const dest = stepForm.destLabware

      return [src, dest]
    }

    if (stepForm.stepType === 'mix') {
      // only 1 labware
      return [stepForm.labware]
    }

    // step types that have no labware that gets highlighted
    if (!(stepForm.stepType === 'pause')) {
      // TODO Ian 2018-05-08 use assert here
      console.warn(`hoveredStepLabware does not support step type "${stepForm.stepType}"`)
    }

    return blank
  }
)

const stepCreationButtonExpandedSelector: Selector<boolean> = createSelector(
  rootSelector,
  (state: RootState) => state.stepCreationButtonExpanded
)

const selectedStepFormDataSelector: Selector<boolean | FormData | BlankForm> = createSelector(
  getSavedForms,
  selectedStepId,
  getSteps,
  (savedStepForms, selectedStepId, steps) => {
    if (selectedStepId === null) {
      // no step selected
      return false
    }

    if (
      selectedStepId === '__end__' ||
      !steps[selectedStepId] ||
      steps[selectedStepId].stepType === 'deck-setup'
    ) {
      // End step has no stepType
      // Deck Setup step has no form data
      // Also skip undefined steps to avoid white-screening, though they shouldn't happen
      return false
    }

    return (
      // existing form
      savedStepForms[selectedStepId] ||
      // new blank form
      generateNewForm(selectedStepId, steps[selectedStepId].stepType)
    )
  }
)

const nextStepId: Selector<number> = createSelector( // generates the next step ID to use
  getSteps,
  (_steps): number => {
    const allStepIds = Object.keys(_steps).map(stepId => parseInt(stepId))
    return allStepIds.length === 0
      ? 0
      : max(allStepIds) + 1
  }
)

// TODO: remove this when we add in form level validation
const currentFormErrors: Selector<null | {[errorName: string]: string}> = (state: BaseState) => {
  const form = formData(state)
  return form && validateAndProcessForm(form).errors // TODO refactor selectors
}

const formLevelWarnings: Selector<null | Array<string>> = (state) => {
  const formData = getUnsavedForm(state)
  if (!formData) return null
  const {id, stepType, ...fields} = formData
  const hydratedFields = mapValues(fields, (value, name) => hydrateField(state, name, value))
  return getFormWarnings(stepType, hydratedFields)
}

const formSectionCollapseSelector: Selector<FormSectionState> = createSelector(
  rootSelector,
  s => s.formSectionCollapse
)

export const allSteps: Selector<{[stepId: StepIdType]: StepItemData}> = createSelector(
  getSteps,
  getCollapsedSteps,
  getSavedForms,
  labwareIngredSelectors.getLabware,
  (steps, collapsedSteps, _savedForms, _labware) => {
    return mapValues(
      steps,
      (step: StepItemData, id: StepIdType): StepItemData => {
        const savedForm = (_savedForms && _savedForms[id]) || null

        // Assign the step title
        let title

        if (savedForm && savedForm['step-name']) {
          title = savedForm['step-name']
        } else if (step.stepType === 'deck-setup') {
          title = 'Deck Setup'
        } else {
          title = `${step.stepType} ${id}`
        }

        return {
          ...steps[id],
          formData: savedForm,
          title,
          description: savedForm ? savedForm['step-details'] : null
        }
      }
    )
  }
)

export const selectedStepSelector = createSelector(
  allSteps,
  selectedStepId,
  (_allSteps, selectedStepId) => {
    const stepId = selectedStepId

    if (!_allSteps || stepId === null || stepId === '__end__') {
      return null
    }

    return _allSteps[stepId]
  }
)

export const currentFormCanBeSaved: Selector<boolean | null> = createSelector(
  formData,
  selectedStepId,
  allSteps,
  (formData, selectedStepId, allSteps) =>
    ((typeof selectedStepId === 'number') && allSteps[selectedStepId] && formData)
      ? !formHasErrors(
        validateAndProcessForm(formData)
      )
      : null
)

export default {
  rootSelector,

  allSteps,
  currentFormCanBeSaved,
  selectedStep: selectedStepSelector,

  stepCreationButtonExpanded: stepCreationButtonExpandedSelector,
  orderedSteps: orderedStepsSelector,
  selectedStepId, // TODO ??? replace with selectedStep: selectedStepSelector ???
  hoveredStepId,
  hoveredOrSelectedStepId,
  getHoveredSubstep,
  selectedStepFormData: selectedStepFormDataSelector,
  getUnsavedForm,
  formData, // TODO: remove after sunset
  formModalData,
  nextStepId,
  validatedForms,
  isNewStepForm,
  currentFormErrors, // TODO: remove after sunset
  formLevelWarnings,
  formSectionCollapse: formSectionCollapseSelector,
  deckSetupMode,
  hoveredStepLabware,

  // NOTE: these are exposed only for substeps/selectors.js
  getSteps,
  orderedStepsSelector,
  getCollapsedSteps,
  getSavedForms
}
