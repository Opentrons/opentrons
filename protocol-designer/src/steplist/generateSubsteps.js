// @flow
import cloneDeep from 'lodash/cloneDeep'
import range from 'lodash/range'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import startCase from 'lodash/startCase'

import type {Channels} from '@opentrons/components'
import {getWellsForTips, commandCreatorsTimeline} from '../step-generation/utils'
import {
  utils as steplistUtils,
  type NamedIngred,
} from '../steplist'

import { type ValidFormAndErrors } from './formLevel/stepFormToArgs'

import type {
  SubstepItemData,
  SourceDestSubstepItem,
  StepItemSourceDestRow,
  StepItemSourceDestRowMulti,
  SourceDestSubstepItemSingleChannel,
} from './types'

import {
  consolidate,
  distribute,
  transfer,
  mix,
} from '../step-generation'

import type {
  AspirateDispenseArgs,
  RobotState,
} from '../step-generation'

import type {
  PipetteData,
  ConsolidateFormData,
  DistributeFormData,
  MixFormData,
  PauseFormData,
  TransferFormData,
} from '../step-generation/types'

type AllPipetteData = {[pipetteId: string]: PipetteData}
type SourceDestSubstepItemRows = $PropertyType<SourceDestSubstepItemSingleChannel, 'rows'>
type SourceDestSubstepItemMultiRows = Array<Array<StepItemSourceDestRowMulti>>

export type GetIngreds = (labware: string, well: string) => Array<NamedIngred>
type GetLabwareType = (labwareId: string) => ?string

type AspDispCommandType = {
  command: 'aspirate' | 'dispense',
  params: AspirateDispenseArgs,
}

function transferLikeSubsteps (args: {
  validatedForm: ConsolidateFormData | DistributeFormData | TransferFormData | MixFormData,
  allPipetteData: AllPipetteData,
  getIngreds: GetIngreds,
  getLabwareType: GetLabwareType,
  robotState: RobotState,
  stepId: number,
}): ?SourceDestSubstepItem {
  const {
    validatedForm,
    allPipetteData,
    getIngreds,
    getLabwareType,
    stepId,
  } = args

  // Add tips to pipettes, since this is just a "simulation"
  // TODO: Ian 2018-07-31 develop more elegant way to bypass tip handling for simulation/test
  const robotState = cloneDeep(args.robotState)
  robotState.tipState.pipettes = mapValues(robotState.tipState.pipettes, () => true)
  const {
    pipette: pipetteId,
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
      mixInDestination: null,
      preWetTip: false,
    }

    // NOTE: result is a flat array of commandCreators
    result = transfer(commandCallArgs)(robotState)
  } else if (validatedForm.stepType === 'distribute') {
    const commandCallArgs = {
      ...validatedForm,
      mixBeforeAspirate: null,
      preWetTip: false,
    }

    result = distribute(commandCallArgs)(robotState)
  } else if (validatedForm.stepType === 'consolidate') {
    const commandCallArgs = {
      ...validatedForm,
      mixFirstAspirate: null,
      mixInDestination: null,
      preWetTip: false,
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
    console.warn('Could not get substep, had errors:', result)
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
            : currentMultiRow[channel].volume,
        }))
      }
    )

    return {
      multichannel: true,
      stepType: validatedForm.stepType,
      parentStepId: stepId,
      multiRows: mergedMultiRows,
    }
  }

  const timeline = commandCreatorsTimeline(result)(robotState)
  const timelineWithInitial = [{robotState}, ...timeline.timeline]

  const LIQUID_COMMANDS = ['aspirate', 'dispense']
  // Single-channel rows
  const aspDispRows: SourceDestSubstepItemRows = timeline.timeline.reduce((acc, frame, timelineIdx) => {
    const {commands} = frame
    // if (timelineIdx === 0) return [...acc, {preVolume: frame.robotState.liquidState.labware}]
    if (commands && commands.some(command => LIQUID_COMMANDS.includes(command.command))) {
      const command = commands[0]
      console.log('commad', command)
      console.log('timelint ', frame.robotState.liquidState.labware[command.params.labware][command.params.well])
      // const preVolumeKey = `pre${startCase(command.command)}Volume`
      const row = frameToRows(frame, getIngreds)
      // const row = {
      //   ...commandToRows(command, getIngreds),
      //   [preVolumeKey]: frame.robotState.liquidState.labware[command.params.labware][command.params.well]
      // }
      return row ? [...acc, row] : acc
    }
    return acc
  }, [])

  let intermediateVolumesByWellByLabware = {}
  const rowsWithIntermediateVols = aspDispRows.map((row, index) => {
    let cloneRow = row
    if (row.sourceWell) {
      if (!intermediateVolumesByWellByLabware[row.labware] || !intermediateVolumesByWellByLabware[row.labware][row.sourceWell]) {
        intermediateVolumesByWellByLabware = {
          ...intermediateVolumesByWellByLabware,
          [row.labware]: {
            ...intermediateVolumesByWellByLabware[row.labware],
            [row.sourceWell]: reduce(row.sourceIngredients, (acc, ingredGroup) => (
              ingredGroup.volume ? Number(ingredGroup.volume) + acc : acc
            ), 0),
          }
        }
      }
      const preSubstepSourceVol = intermediateVolumesByWellByLabware[row.labware][row.sourceWell] || 0
      cloneRow = {
        ...cloneRow,
        preSubstepSourceVol,
      }
      intermediateVolumesByWellByLabware = {
        ...intermediateVolumesByWellByLabware,
        [row.labware]: {
          ...intermediateVolumesByWellByLabware[row.labware],
          [row.sourceWell]: preSubstepSourceVol - row.volume,
        },
      }
    } else if (row.destWell) {
      if (!intermediateVolumesByWellByLabware[row.labware] || !intermediateVolumesByWellByLabware[row.labware][row.destWell]) {
        intermediateVolumesByWellByLabware = {
          ...intermediateVolumesByWellByLabware,
          [row.labware]: {
            ...intermediateVolumesByWellByLabware[row.labware],
            [row.destWell]: reduce(row.destIngredients, (acc, ingredGroup) => (
              ingredGroup.volume ? Number(ingredGroup.volume) + acc : acc
            ), 0),
          },
        }
      }
      const preSubstepDestVol = intermediateVolumesByWellByLabware[row.labware][row.destWell] || 0
      cloneRow = {
        ...cloneRow,
        preSubstepDestVol,
      }
      intermediateVolumesByWellByLabware = {
        ...intermediateVolumesByWellByLabware,
        [row.labware]: {
          ...intermediateVolumesByWellByLabware[row.labware],
          [row.destWell]: preSubstepDestVol + row.volume,
        },
      }
    }
    return cloneRow
  })

  const mergedRows: SourceDestSubstepItemRows = steplistUtils.mergeWhen(
    rowsWithIntermediateVols,
    (currentRow, nextRow) =>
      // NOTE: if aspirate then dispense rows are adjacent, collapse them into one row
      currentRow.sourceWell && nextRow.destWell,
    (currentRow, nextRow) => ({
      ...nextRow,
      ...currentRow,
      volume: showDispenseVol
        ? nextRow.volume
        : currentRow.volume,
    })
  )

  return {
    multichannel: false,
    stepType: validatedForm.stepType,
    parentStepId: stepId,
    rows: mergedRows,
  }
}

function frameToRows (
  frame,
  getIngreds: GetIngreds
): ?StepItemSourceDestRow {
  const command = frame.commands[0]
  if (command.command === 'aspirate') {
    const {well, volume, labware} = command.params
    return {
      sourceIngredients: getIngreds(labware, well),
      sourceWell: well,
      volume,
      sourceLabware: labware,
      sourceIngreds: frame.robotState.liquidState.labware[command.params.labware][command.params.well],
    }
  }

  if (command.command === 'dispense') {
    const {well, volume, labware} = command.params
    return {
      destIngredients: getIngreds(labware, well),
      destWell: well,
      volume,
      destLabware: labware,
      destIngreds: frame.robotState.liquidState.labware[command.params.labware][command.params.well],
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
        volume,
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
      volume,
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
  stepId: number // stepId is used only for substeps to reference parent step
): ?SubstepItemData {
  if (!robotState) {
    console.info(`No robot state, could not generate substeps for step ${stepId}.` +
      `There was probably an upstream error.`)
    return null
  }

  // TODO: BC: 2018-08-21 replace old error check with new logic in field, form, and timeline level
  // Don't try to render with form errors. TODO LATER: presentational error state of substeps?
  if (!valForm || !valForm.validatedForm || Object.values(valForm.errors).length > 0) {
    return null
  }

  const validatedForm = valForm.validatedForm

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
      stepId,
    })
  }

  console.warn('allSubsteps doesn\'t support step type: ', validatedForm.stepType, stepId)
  return null
}
