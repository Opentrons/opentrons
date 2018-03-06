// @flow
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'

import {
  formHasErrors,
  type ValidFormAndErrors
} from './formProcessing'

import type {
  StepIdType,
  SubSteps,
  PauseFormData
} from './types'

function _transferSubsteps (form: *, stepId: StepIdType) {
  const {
    sourceWells,
    destWells
    // sourceLabware, // TODO: show labware & volume, see new designs
    // destLabware,
    // volume
  } = form

  return {
    stepType: 'transfer',
    parentStepId: stepId,
    // TODO Ian 2018-03-02 break up steps when pipette too small
    rows: range(sourceWells.length).map(i => ({
      substepId: i,
      sourceIngredientName: 'ING1', // TODO get ingredients for source/dest wells
      destIngredientName: 'ING2',
      sourceWell: sourceWells[i],
      destWell: destWells[i]
    }))
  }
}

function _consolidateSubsteps (form: *, stepId: StepIdType) {
  const {
    sourceWells,
    destWell
  } = form

  const destWellSubstep = {
    destWell,
    sourceIngredientName: 'ING1',
    destIngredientName: 'ING2'
  }

  return {
    stepType: 'consolidate',
    parentStepId: stepId,
    rows: [
      ...sourceWells.map((sourceWell, i) => ({
        substepId: i,
        sourceWell: sourceWell,
        sourceIngredientName: 'ING1'
      })),
      destWellSubstep
    ]
  }
}

export function generateSubsteps (validatedForms: {[StepIdType]: ValidFormAndErrors}): SubSteps {
  return mapValues(validatedForms, (valForm: ValidFormAndErrors, stepId: StepIdType) => {
    // Don't try to render with errors. TODO LATER: presentational error state of substeps?
    if (valForm.validatedForm === null || formHasErrors(valForm)) {
      return null
    }

    if (valForm.validatedForm.stepType === 'deck-setup') {
      // No substeps for Deck Setup
      return null
    }

    if (valForm.validatedForm.stepType === 'transfer') {
      return _transferSubsteps(valForm.validatedForm, stepId)
    }

    if (valForm.validatedForm.stepType === 'pause') {
      // just returns formData
      const formData: PauseFormData = valForm.validatedForm
      return formData
    }

    if (valForm.validatedForm.stepType === 'consolidate') {
      return _consolidateSubsteps(valForm.validatedForm, stepId)
    }

    console.warn('allSubsteps doesnt support step type: ', valForm.validatedForm.stepType, stepId)
    return null
  })
}
