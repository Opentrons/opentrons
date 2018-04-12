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
import type {AllWellContents} from '../labware-ingred/types'

type AllPipetteData = {[pipetteId: string]: PipetteData} // TODO make general type, key by ID not mount?
type AllLabwareTypes = {[labwareId: string]: string}
type WellContentsByLabware = {[labwareId: string]: AllWellContents}
function _transferSubsteps (
  form: *,
  pipetteData: AllPipetteData,
  allLabwareTypes: AllLabwareTypes,
  stepId: StepIdType,
  allWellContents: WellContentsByLabware
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

        return range(channels).map(channel => {
          const sourceWell = sourceWellsForTips[channel]
          const destWell = destWellsForTips[channel]

          function fakeHackGroupIdsToIngred (groupIds: Array<string>) {
            // HACK HACK HACK
            // TODO Ian 2018-04-11 need to pass this in -- should it be pre-processed, eg instead of using wellContents?
            return groupIds.map(id => ({
              id: parseInt(id),
              name: id
            }))
          }

          const sourceIngredients = fakeHackGroupIdsToIngred(
            allWellContents[form.sourceLabware][sourceWell].groupIds
          )

          const destIngredients = fakeHackGroupIdsToIngred(
            // TODO Ian 2018-04-11 should dest be PREVIOUS liquid state?
            allWellContents[form.destLabware][destWell].groupIds
          )

          return {
            substepId: i,
            channelId: channel,
            sourceIngredients,
            destIngredients,
            sourceWell,
            destWell
          }
        })
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
      sourceIngredients: [{id: 0, name: 'ING1'}], // TODO CONNECT
      destIngredients: [{id: 1, name: 'ING2'}], // TODO CONNECT
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
  stepId: StepIdType,
  allWellContents: WellContentsByLabware
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

        return range(channels).map(channel => {
          const sourceWell = sourceWellsForTips[channel]
          // only show dest wells on last group
          const destWell = isLastGroup ? destWellsForTips[channel] : null
          const destIngredients = isLastGroup ? [{id: 1, name: 'ING2'}] : null  // TODO CONNECT

          return {
            substepId: i,
            sourceIngredients: [{id: 0, name: 'ING1'}], // TODO CONNECT
            destIngredients,
            sourceWell,
            destWell,
            volume
          }
        })
      }) // TODO concat the final source : dest
    }
  }

  const destWellSubstep = {
    destWell,
    destIngredients: [{id: 1, name: 'ING2'}], // TODO CONNECT
    volume: volume * sourceWells.length
  }

  return {
    ...commonFields,
    multichannel: false,
    // TODO Ian 2018-03-02 break up steps when pipette too small
    rows: [
      ...sourceWells.map((sourceWell, i) => ({
        substepId: i,
        sourceWell,
        sourceIngredients: [{id: 0, name: 'ING1'}], // TODO CONNECT
        volume
      })),
      destWellSubstep
    ]
  }
}

// NOTE: This is the fn used by the `allSubsteps` selector
export function generateSubsteps (
  validatedForms: {[StepIdType]: ValidFormAndErrors},
  allPipetteData: AllPipetteData,
  allLabwareTypes: AllLabwareTypes,
  allWellContentsForSteps: Array<WellContentsByLabware>
): SubSteps {
  return mapValues(validatedForms, (valForm: ValidFormAndErrors, stepId: StepIdType) => {
    const allWellContents = allWellContentsForSteps[stepId]

    // Don't try to render with errors. TODO LATER: presentational error state of substeps?
    if (valForm.validatedForm === null || formHasErrors(valForm)) {
      return null
    }

    if (valForm.validatedForm.stepType === 'deck-setup') {
      // No substeps for Deck Setup
      return null
    }

    if (valForm.validatedForm.stepType === 'transfer') {
      return _transferSubsteps(valForm.validatedForm, allPipetteData, allLabwareTypes, stepId, allWellContents)
    }

    if (valForm.validatedForm.stepType === 'pause') {
      // just returns formData
      const formData: PauseFormData = valForm.validatedForm
      return formData
    }

    if (valForm.validatedForm.stepType === 'consolidate') {
      return _consolidateSubsteps(valForm.validatedForm, allPipetteData, allLabwareTypes, stepId, allWellContents)
    }

    console.warn('allSubsteps doesnt support step type: ', valForm.validatedForm.stepType, stepId)
    return null
  })
}
