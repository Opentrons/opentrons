// @flow
import range from 'lodash/range'

import type {Channels} from '@opentrons/components'
import {getWellsForTips} from '../step-generation/utils'
import {
  utils as steplistUtils,
  type NamedIngred
} from '../steplist'

import {
  formHasErrors,
  type ValidFormAndErrors
} from './formProcessing'

import type {
  SubstepItemData,
  SourceDestSubstepItem,
  StepItemSourceDestRow,
  StepItemSourceDestRowMulti,
  SourceDestSubstepItemSingleChannel
} from './types'

import {
  consolidate,
  distribute,
  transfer,
  mix
} from '../step-generation'

import type {
  AspirateDispenseArgs,
  RobotState
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
type SourceDestSubstepItemRows = $PropertyType<SourceDestSubstepItemSingleChannel, 'rows'>
type SourceDestSubstepItemMultiRows = Array<Array<StepItemSourceDestRowMulti>>

export type GetIngreds = (labware: string, well: string) => Array<NamedIngred>
type GetLabwareType = (labwareId: string) => ?string

type AspDispCommandType = {
  command: 'aspirate' | 'dispense',
  params: AspirateDispenseArgs
}

function transferLikeSubsteps (args: {
  validatedForm: ConsolidateFormData | DistributeFormData | TransferFormData | MixFormData,
  allPipetteData: AllPipetteData,
  getIngreds: GetIngreds,
  getLabwareType: GetLabwareType,
  robotState: RobotState,
  stepId: number
}): ?SourceDestSubstepItem {
  const {
    validatedForm,
    allPipetteData,
    getIngreds,
    getLabwareType,
    robotState,
    stepId
  } = args

  const {
    pipette: pipetteId
  } = validatedForm

  const pipette = allPipetteData[pipetteId]

  // TODO Ian 2018-04-06 use assert here
  if (!pipette) {
    console.warn(`Pipette "${pipetteId}" does not exist, step ${stepId} can't determine channels`)
  }

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

function commandToRows (
  command: AspDispCommandType,
  getIngreds: GetIngreds
): ?StepItemSourceDestRow {
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
  channels: Channels
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
    const ingreds = getIngreds(labwareId, well)
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

// NOTE: This is the fn used by the `allSubsteps` selector
export function generateSubsteps (
  valForm: ?ValidFormAndErrors,
  allPipetteData: AllPipetteData,
  getLabwareType: GetLabwareType,
  getIngreds: GetIngreds,
  robotState: ?RobotState,
  stepId: number
): ?SubstepItemData {
  if (!robotState) return null

  // Don't try to render with form errors. TODO LATER: presentational error state of substeps?
  if (!valForm || !valForm.validatedForm || formHasErrors(valForm)) {
    return null
  }

  const validatedForm = valForm.validatedForm

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
    return transferLikeSubsteps({
      validatedForm,
      allPipetteData,
      getIngreds,
      getLabwareType,
      robotState,
      stepId
    })
  }

  console.warn('allSubsteps doesn\'t support step type: ', validatedForm.stepType, stepId)
  return null
}
