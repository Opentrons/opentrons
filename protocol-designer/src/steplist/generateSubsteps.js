// @flow
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'

import {getWellsForTips} from '../step-generation/utils'
import {utils as steplistUtils} from '../steplist'

import {
  formHasErrors,
  type ValidFormAndErrors
} from './formProcessing'

import type {
  NamedIngredsByLabwareAllSteps,
  SubSteps,
  SourceDestSubstepItem,
  StepItemSourceDestRow,
  StepItemSourceDestRowMulti,
  SourceDestSubstepItemSingleChannel,
  NamedIngred
} from './types'

import type {StepIdType} from '../form-types'
import type {RobotStateTimelineAcc} from '../file-data/selectors'
import {
  consolidate,
  distribute,
  transfer,
  mix
} from '../step-generation'

import type {
  AspirateDispenseArgs
  // CommandCreator
} from '../step-generation'

import type {
  PipetteData,
  ConsolidateFormData,
  DistributeFormData,
  MixFormData,
  PauseFormData,
  TransferFormData
} from '../step-generation/types'

type AllPipetteData = {[pipetteId: string]: PipetteData}
type AllLabwareTypes = {[labwareId: string]: string}
type SourceDestSubstepItemRows = $PropertyType<SourceDestSubstepItemSingleChannel, 'rows'>
type SourceDestSubstepItemMultiRows = Array<Array<StepItemSourceDestRowMulti>>
type GetIngreds = (labware: string, well: string) => Array<NamedIngred>
type GetLabwareType = (labwareId: string) => ?string

type AspDispCommandType = {
  command: 'aspirate' | 'dispense',
  params: AspirateDispenseArgs
}

function transferLikeSubsteps (args: {
  validatedForm: ConsolidateFormData | DistributeFormData | TransferFormData | MixFormData,
  allPipetteData: AllPipetteData,
  stepId: StepIdType,
  prevStepId: StepIdType,
  getIngreds: GetIngreds,
  getLabwareType: GetLabwareType,
  robotStateTimeline: RobotStateTimelineAcc
}): ?SourceDestSubstepItem {
  const {
    validatedForm,
    allPipetteData,
    stepId,
    prevStepId,
    getIngreds,
    getLabwareType,
    robotStateTimeline
  } = args

  const {
    pipette: pipetteId
  } = validatedForm

  const pipette = allPipetteData[pipetteId]

  // TODO Ian 2018-04-06 use assert here
  if (!pipette) {
    console.warn(`Pipette "${pipetteId}" does not exist, step ${stepId} can't determine channels`)
  }

  const robotState = (
    robotStateTimeline.timeline[prevStepId] &&
    robotStateTimeline.timeline[prevStepId].robotState
  ) || robotStateTimeline.robotState

  // if false, show aspirate vol instead
  const showDispenseVol = validatedForm.stepType === 'distribute'

  let result

  // Call appropriate command creator with the validateForm fields.
  // Disable any mix args so those aspirate/dispenses don't show up in substeps
  if (validatedForm.stepType === 'transfer') {
    const commandCallArgs = {
      ...validatedForm,
      mixBeforeAspirate: null,
      mixInDestination: null
    }

    result = transfer(commandCallArgs)(robotState)
  } else if (validatedForm.stepType === 'distribute') {
    const commandCallArgs = {
      ...validatedForm,
      mixBeforeAspirate: null
    }

    result = distribute(commandCallArgs)(robotState)
  } else if (validatedForm.stepType === 'consolidate') {
    const commandCallArgs = {
      ...validatedForm,
      mixBeforeAspirate: null
    }

    result = consolidate(commandCallArgs)(robotState)
  } else if (validatedForm.stepType === 'mix') {
    result = mix(validatedForm)(robotState)
  } else {
    // TODO Ian 2018-05-21 Use assert here. Should be unreachable
    console.warn(`transferLikeSubsteps got unsupported stepType "${validatedForm.stepType}"`)
    return null
  }

  if (result.errors) {
    return null
  }

  // Multichannel substeps
  if (pipette.channels > 1) {
    const aspDispMultiRows: SourceDestSubstepItemMultiRows = result.commands.reduce((acc, c, commandIdx) => {
      if (c.command === 'aspirate' || c.command === 'dispense') {
        const rows = commandToMultiRows(c, getIngreds, getLabwareType, pipette.channels)
        return rows ? [...acc, rows] : acc
      }
      return acc
    }, [])

    const mergedMultiRows: SourceDestSubstepItemMultiRows = steplistUtils.mergeWhen(
      aspDispMultiRows,
      (currentMultiRow, nextMultiRow) => {
        // aspirate then dispense multirows adjacent
        // (inferring from first channel row in each multirow)
        return currentMultiRow[0] && currentMultiRow[0].sourceWell &&
        nextMultiRow[0] && nextMultiRow[0].destWell
      },
      // Merge each channel row together when predicate true
      (currentMultiRow, nextMultiRow) => {
        return range(pipette.channels).map(channel => ({
          ...currentMultiRow[channel],
          ...nextMultiRow[channel],
          volume: showDispenseVol
            ? nextMultiRow[channel].volume
            : currentMultiRow[channel].volume
        }))
      }
    )

    return {
      multichannel: true,
      stepType: validatedForm.stepType,
      parentStepId: stepId,
      multiRows: mergedMultiRows
    }
  }

  // Single-channel rows
  const aspDispRows: SourceDestSubstepItemRows = result.commands.reduce((acc, c, commandIdx) => {
    if (c.command === 'aspirate' || c.command === 'dispense') {
      const row = commandToRows(c, getIngreds)
      return row ? [...acc, row] : acc
    }
    return acc
  }, [])

  const mergedRows: SourceDestSubstepItemRows = steplistUtils.mergeWhen(
    aspDispRows,
    (currentRow, nextRow) =>
      // aspirate then dispense rows adjacent
      currentRow.sourceWell && nextRow.destWell,
    (currentRow, nextRow) => ({
      ...nextRow,
      ...currentRow,
      volume: showDispenseVol
        ? nextRow.volume
        : currentRow.volume
    })
  )

  return {
    multichannel: false,
    stepType: validatedForm.stepType,
    parentStepId: stepId,
    rows: mergedRows
  }
}

function commandToRows (command: AspDispCommandType, getIngreds: GetIngreds): ?StepItemSourceDestRow {
  if (command.command === 'aspirate') {
    const {well, volume, labware} = command.params
    return {
      sourceIngredients: getIngreds(labware, well),
      sourceWell: well,
      volume
    }
  }

  if (command.command === 'dispense') {
    const {well, volume, labware} = command.params
    return {
      destIngredients: getIngreds(labware, well),
      destWell: well,
      volume
    }
  }

  return null
}

function commandToMultiRows (
  command: AspDispCommandType,
  getIngreds: GetIngreds,
  getLabwareType: GetLabwareType,
  channels: *
): ?Array<StepItemSourceDestRowMulti> {
  const labwareId = command.params.labware
  const labwareType = getLabwareType(labwareId)

  if (!labwareType) {
    console.warn(`No labwareType for labwareId ${labwareId}`)
    return null
  }
  const wellsForTips = getWellsForTips(channels, labwareType, command.params.well).wellsForTips

  return range(channels).map(channel => {
    const well = wellsForTips[channel]
    const ingreds = getIngreds(labwareId, command.params.well)
    const volume = command.params.volume

    if (command.command === 'aspirate') {
      return {
        channelId: channel,
        sourceIngredients: ingreds,
        sourceWell: well,
        volume
      }
    }
    if (command.command !== 'dispense') {
      // TODO Ian 2018-05-17 use assert
      console.warn(`expected aspirate or dispense in commandToMultiRows, got ${command.command}`)
    }
    // dispense
    return {
      channelId: channel,
      destIngredients: ingreds,
      destWell: well,
      volume
    }
  })
}

const getIngredsFactory = (
  namedIngredsByLabwareAllSteps: NamedIngredsByLabwareAllSteps,
  stepId: StepIdType
): GetIngreds => (labware, well) => {
  return (namedIngredsByLabwareAllSteps &&
    namedIngredsByLabwareAllSteps[stepId] &&
    namedIngredsByLabwareAllSteps[stepId][labware] &&
    namedIngredsByLabwareAllSteps[stepId][labware][well]) || []
}

const getLabwareTypeFactory = (allLabwareTypes: AllLabwareTypes): GetLabwareType => (labwareId) => {
  return allLabwareTypes && allLabwareTypes[labwareId]
}

// NOTE: This is the fn used by the `allSubsteps` selector
export function generateSubsteps (
  validatedForms: {[StepIdType]: ValidFormAndErrors},
  allPipetteData: AllPipetteData,
  allLabwareTypes: AllLabwareTypes,
  namedIngredsByLabwareAllSteps: NamedIngredsByLabwareAllSteps,
  orderedSteps: Array<StepIdType>,
  robotStateTimeline: RobotStateTimelineAcc
): SubSteps {
  return mapValues(validatedForms, (valForm: ValidFormAndErrors, stepId: StepIdType) => {
    const validatedForm = valForm.validatedForm
    const prevStepId = steplistUtils.getPrevStepId(orderedSteps, stepId)

    // Don't try to render with errors. TODO LATER: presentational error state of substeps?
    if (validatedForm === null || formHasErrors(valForm)) {
      return null
    }

    if (validatedForm.stepType === 'deck-setup') {
      // No substeps for Deck Setup
      return null
    }

    if (validatedForm.stepType === 'pause') {
      // just returns formData
      const formData: PauseFormData = validatedForm
      return formData
    }

    if (
      validatedForm.stepType === 'consolidate' ||
      validatedForm.stepType === 'distribute' ||
      validatedForm.stepType === 'transfer' ||
      validatedForm.stepType === 'mix'
    ) {
      const getIngreds = getIngredsFactory(namedIngredsByLabwareAllSteps, prevStepId)
      const getLabwareType = getLabwareTypeFactory(allLabwareTypes)
      // TODO SOON Ian 2018-05-17 all transferlikes will use this fn in next PR
      return transferLikeSubsteps({
        validatedForm,
        allPipetteData,
        stepId,
        prevStepId,
        getIngreds,
        getLabwareType,
        robotStateTimeline
      })
    }

    console.warn('allSubsteps doesn\'t support step type: ', validatedForm.stepType, stepId)
    return null
  })
}
