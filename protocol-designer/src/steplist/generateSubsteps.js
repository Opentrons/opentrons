// @flow
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'

import {getWellsForTips} from '../step-generation/utils'

import {
  formHasErrors,
  type ValidFormAndErrors
} from './formProcessing'

import type {
  StepIdType,
  SubSteps,
  PauseFormData
} from './types'

import type {PipetteData} from '../step-generation/types'

type AllPipetteData = {[pipetteId: string]: PipetteData} // TODO make general type, key by ID not mount?
type AllLabwareTypes = {[labwareId: string]: string}

function _transferSubsteps (
  form: *,
  pipetteData: AllPipetteData,
  allLabwareTypes: AllLabwareTypes,
  stepId: StepIdType
) {
  const {
    sourceWells,
    destWells,
    volume
  } = form

  const commonFields = {
    stepType: 'transfer',
    parentStepId: stepId
  }

  // TODO Ian 2018-04-06 use assert here
  if (!pipetteData[form.pipette]) {
    console.warn(`Pipette "${form.pipette}" does not exist, step ${stepId} can't determine channels`)
  }

  if (pipetteData[form.pipette] && pipetteData[form.pipette].channels > 1) {
    // multichannel
    const channels = pipetteData[form.pipette].channels

    const sourceLabwareType = allLabwareTypes[form.sourceLabware]
    const destLabwareType = allLabwareTypes[form.destLabware]

    return {
      ...commonFields,
      multichannel: true,
      volume,
      multiRows: range(sourceWells.length).map(i => {
        const sourceWellsForTips = getWellsForTips(channels, sourceLabwareType, sourceWells[i]).wellsForTips
        const destWellsForTips = getWellsForTips(channels, destLabwareType, destWells[i]).wellsForTips

        return range(channels).map(channel =>
          ({
            substepId: i,
            channelId: channel,
            // TODO LATER Ian 2018-04-06 ingredient name & color passed in from store
            sourceIngredientName: 'ING1',
            destIngredientName: 'ING2',
            sourceWell: sourceWellsForTips[channel],
            destWell: destWellsForTips[channel]
          })
        )
      })
    }
  }

  return {
    ...commonFields,
    multichannel: false,
    // TODO Ian 2018-03-02 break up steps when pipette too small
    rows: range(sourceWells.length).map(i => ({
      substepId: i,
      // TODO LATER Ian 2018-04-06 ingredient name & color passed in from store
      sourceIngredientName: 'ING1',
      destIngredientName: 'ING2',
      sourceWell: sourceWells[i],
      destWell: destWells[i],
      volume
    }))
  }
}

function _consolidateSubsteps (
  form: *,
  pipetteData: AllPipetteData,
  allLabwareTypes: AllLabwareTypes,
  stepId: StepIdType
) {
  const {
    sourceWells,
    destWell,
    volume
  } = form

  const commonFields = {
    stepType: 'consolidate',
    parentStepId: stepId
  }

  // TODO Ian 2018-04-09 ~7 lines identical to transfer multichannel handling, candidate for util fn?
  // TODO Ian 2018-04-06 use assert here
  if (!pipetteData[form.pipette]) {
    console.warn(`Pipette "${form.pipette}" does not exist, step ${stepId} can't determine channels`)
  }

  if (pipetteData[form.pipette] && pipetteData[form.pipette].channels > 1) {
    // multichannel
    const channels = pipetteData[form.pipette].channels

    const sourceLabwareType = allLabwareTypes[form.sourceLabware]
    const destLabwareType = allLabwareTypes[form.destLabware]

    const destWellsForTips = getWellsForTips(channels, destLabwareType, destWell).wellsForTips

    return {
      ...commonFields,
      multichannel: true,
      volume,
      multiRows: range(sourceWells.length).map(i => {
        const isLastGroup = i + 1 === sourceWells.length
        const sourceWellsForTips = getWellsForTips(channels, sourceLabwareType, sourceWells[i]).wellsForTips

        return range(channels).map(channel => ({
          substepId: i,
          // TODO LATER Ian 2018-04-06 ingredient name & color passed in from store
          sourceIngredientName: 'ING1',
          destIngredientName: isLastGroup ? 'ING2' : null,
          sourceWell: sourceWellsForTips[channel],
          destWell: isLastGroup ? destWellsForTips[channel] : null, // only show dest wells on last group
          volume
        }))
      }) // TODO concat the final source : dest
    }
  }

  const destWellSubstep = {
    destWell,
    sourceIngredientName: 'ING1', // TODO Ian 2018-03-20 proper ingredient name & groupId/color
    destIngredientName: 'ING2',
    volume: volume * sourceWells.length
  }

  return {
    ...commonFields,
    multichannel: false,
    // TODO Ian 2018-03-02 break up steps when pipette too small
    rows: [
      ...sourceWells.map((sourceWell, i) => ({
        substepId: i,
        sourceWell: sourceWell,
        sourceIngredientName: 'ING1',
        volume: volume
      })),
      destWellSubstep
    ]
  }
}

// NOTE: This is the fn used by the `allSubsteps` selector
export function generateSubsteps (
  validatedForms: {[StepIdType]: ValidFormAndErrors},
  allPipetteData: AllPipetteData,
  allLabwareTypes: AllLabwareTypes
): SubSteps {
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
      return _transferSubsteps(valForm.validatedForm, allPipetteData, allLabwareTypes, stepId)
    }

    if (valForm.validatedForm.stepType === 'pause') {
      // just returns formData
      const formData: PauseFormData = valForm.validatedForm
      return formData
    }

    if (valForm.validatedForm.stepType === 'consolidate') {
      return _consolidateSubsteps(valForm.validatedForm, allPipetteData, allLabwareTypes, stepId)
    }

    console.warn('allSubsteps doesnt support step type: ', valForm.validatedForm.stepType, stepId)
    return null
  })
}
