// @flow
import cloneDeep from 'lodash/cloneDeep'
import range from 'lodash/range'
import mapValues from 'lodash/mapValues'
import isEmpty from 'lodash/isEmpty'

import substepTimeline from './substepTimeline'
import {
  utils as steplistUtils,
  type NamedIngred,
  type StepArgsAndErrors,
} from '../steplist'

import type {
  SubstepItemData,
  SourceDestSubstepItem,
  SubstepTimelineFrame,
  StepItemSourceDestRow,
} from './types'

import {
  consolidate,
  distribute,
  transfer,
  mix,
} from '../step-generation'

import type {StepIdType} from '../form-types'
import type {RobotState} from '../step-generation'

import type {
  PipetteData,
  ConsolidateFormData,
  DistributeFormData,
  MixFormData,
  PauseFormData,
  TransferFormData,
} from '../step-generation/types'

type AllPipetteData = {[pipetteId: string]: PipetteData}

export type GetIngreds = (labware: string, well: string) => Array<NamedIngred>
type GetLabwareType = (labwareId: string) => ?string

function transferLikeSubsteps (args: {
  stepArgs: ConsolidateFormData | DistributeFormData | TransferFormData | MixFormData,
  allPipetteData: AllPipetteData,
  getLabwareType: GetLabwareType,
  robotState: RobotState,
  stepId: StepIdType,
}): ?SourceDestSubstepItem {
  const {
    stepArgs,
    allPipetteData,
    getLabwareType,
    stepId,
  } = args

  // Add tips to pipettes, since this is just a "simulation"
  // TODO: Ian 2018-07-31 develop more elegant way to bypass tip handling for simulation/test
  const robotState = cloneDeep(args.robotState)
  robotState.tipState.pipettes = mapValues(robotState.tipState.pipettes, () => true)
  const {pipette: pipetteId} = stepArgs

  const pipette = allPipetteData[pipetteId]

  // TODO Ian 2018-04-06 use assert here
  if (!pipette) {
    console.warn(`Pipette "${pipetteId}" does not exist, step ${stepId} can't determine channels`)
  }

  // if false, show aspirate vol instead
  const showDispenseVol = stepArgs.stepType === 'distribute'

  let substepCommandCreators

  // Call appropriate command creator with the validateForm fields.
  // Disable any mix args so those aspirate/dispenses don't show up in substeps
  if (stepArgs.stepType === 'transfer') {
    const commandCallArgs = {
      ...stepArgs,
      mixBeforeAspirate: null,
      mixInDestination: null,
      preWetTip: false,
    }

    substepCommandCreators = transfer(commandCallArgs)(robotState)
  } else if (stepArgs.stepType === 'distribute') {
    const commandCallArgs = {
      ...stepArgs,
      mixBeforeAspirate: null,
      preWetTip: false,
    }

    substepCommandCreators = distribute(commandCallArgs)(robotState)
  } else if (stepArgs.stepType === 'consolidate') {
    const commandCallArgs = {
      ...stepArgs,
      mixFirstAspirate: null,
      mixInDestination: null,
      preWetTip: false,
    }

    substepCommandCreators = consolidate(commandCallArgs)(robotState)
  } else if (stepArgs.stepType === 'mix') {
    substepCommandCreators = mix(stepArgs)(robotState)
  } else {
    // TODO Ian 2018-05-21 Use assert here. Should be unreachable
    console.warn(`transferLikeSubsteps got unsupported stepType "${stepArgs.stepType}"`)
    return null
  }

  // Multichannel substeps
  if (pipette.channels > 1) {
    const substepRows: Array<SubstepTimelineFrame> = substepTimeline(
      substepCommandCreators,
      {channels: pipette.channels, getLabwareType},
    )(robotState)
    const mergedMultiRows: Array<Array<StepItemSourceDestRow>> = steplistUtils.mergeWhen(
      substepRows,
      (currentMultiRow: SubstepTimelineFrame, nextMultiRow: SubstepTimelineFrame) => {
        // aspirate then dispense multirows adjacent
        // (inferring from first channel row in each multirow)
        return currentMultiRow && currentMultiRow.source &&
        nextMultiRow && nextMultiRow.dest
      },
      // Merge each channel row together when predicate true
      (currentMultiRow, nextMultiRow) => {
        return range(pipette.channels).map(channelIndex => {
          const sourceChannelWell = currentMultiRow.source && currentMultiRow.source.wells[channelIndex]
          const destChannelWell = nextMultiRow.dest && nextMultiRow.dest.wells[channelIndex]
          const source = currentMultiRow.source && sourceChannelWell && {
            well: sourceChannelWell,
            preIngreds: currentMultiRow.source.preIngreds[sourceChannelWell],
            postIngreds: currentMultiRow.source.postIngreds[sourceChannelWell],
          }
          const dest = nextMultiRow.dest && destChannelWell && {
            well: destChannelWell,
            preIngreds: nextMultiRow.dest.preIngreds[destChannelWell],
            postIngreds: nextMultiRow.dest.postIngreds[destChannelWell],
          }
          const activeTips = currentMultiRow.activeTips
          return {
            activeTips,
            source,
            dest: stepArgs.stepType === 'mix' ? source : dest, // NOTE: since source and dest are same for mix, we're showing source on both sides. Otherwise dest would show the intermediate volume state
            volume: showDispenseVol ? nextMultiRow.volume : currentMultiRow.volume,
          }
        })
      },
      (currentMultiRow) => (
        range(pipette.channels).map(channelIndex => {
          const source = currentMultiRow.source && {
            well: currentMultiRow.source.wells[channelIndex],
            preIngreds: currentMultiRow.source.preIngreds[currentMultiRow.source.wells[channelIndex]],
            postIngreds: currentMultiRow.source.postIngreds[currentMultiRow.source.wells[channelIndex]],
          }
          const dest = currentMultiRow.dest && {
            well: currentMultiRow.dest.wells[channelIndex],
            preIngreds: currentMultiRow.dest.preIngreds[currentMultiRow.dest.wells[channelIndex]],
            postIngreds: currentMultiRow.dest.postIngreds[currentMultiRow.dest.wells[channelIndex]],
          }
          const activeTips = currentMultiRow.activeTips
          return {activeTips, source, dest, volume: currentMultiRow.volume}
        })
      )
    )
    return {
      multichannel: true,
      stepType: stepArgs.stepType,
      parentStepId: stepId,
      multiRows: mergedMultiRows,
    }
  } else { // single channel
    const substepRows = substepTimeline(substepCommandCreators)(robotState)

    const mergedRows: Array<StepItemSourceDestRow> = steplistUtils.mergeWhen(
      substepRows,
      (currentRow, nextRow) =>
        // NOTE: if aspirate then dispense rows are adjacent, collapse them into one row
        currentRow.source && nextRow.dest,
      (currentRow, nextRow) => ({
        ...currentRow,
        source: {
          well: currentRow.source && currentRow.source.wells[0],
          preIngreds: currentRow.source && currentRow.source.preIngreds,
          postIngreds: currentRow.source && currentRow.source.postIngreds,
        },
        ...nextRow,
        dest: {
          well: nextRow.dest && nextRow.dest.wells[0],
          preIngreds: nextRow.dest && nextRow.dest.preIngreds,
          postIngreds: nextRow.dest && nextRow.dest.postIngreds,
        },
        volume: showDispenseVol
          ? nextRow.volume
          : currentRow.volume,
      }),
      (currentRow) => {
        const source = currentRow.source && {
          well: currentRow.source.wells[0],
          preIngreds: currentRow.source.preIngreds,
          postIngreds: currentRow.source.postIngreds,
        }
        const dest = currentRow.dest && {
          well: currentRow.dest.wells[0],
          preIngreds: currentRow.dest.preIngreds,
          postIngreds: currentRow.dest.postIngreds,
        }
        return {
          activeTips: currentRow.activeTips,
          source,
          dest,
          volume: currentRow.volume,
        }
      }
    )

    return {
      multichannel: false,
      stepType: stepArgs.stepType,
      parentStepId: stepId,
      rows: mergedRows,
    }
  }
}

// NOTE: This is the fn used by the `allSubsteps` selector
export function generateSubsteps (
  stepArgsAndErrors: ?StepArgsAndErrors,
  allPipetteData: AllPipetteData,
  getLabwareType: GetLabwareType,
  robotState: ?RobotState,
  stepId: string
): ?SubstepItemData {
  if (!robotState) {
    console.info(`No robot state, could not generate substeps for step ${stepId}.` +
      `There was probably an upstream error.`)
    return null
  }

  // TODO: BC: 2018-08-21 replace old error check with new logic in field, form, and timeline level
  // Don't try to render with form errors. TODO LATER: presentational error state of substeps?
  if (!stepArgsAndErrors || !stepArgsAndErrors.stepArgs || !isEmpty(stepArgsAndErrors.errors)) {
    return null
  }

  const {stepArgs} = stepArgsAndErrors

  if (stepArgs.stepType === 'pause') {
    // just returns formData
    const formData: PauseFormData = stepArgs
    return formData
  }

  if (
    stepArgs.stepType === 'consolidate' ||
    stepArgs.stepType === 'distribute' ||
    stepArgs.stepType === 'transfer' ||
    stepArgs.stepType === 'mix'
  ) {
    return transferLikeSubsteps({
      stepArgs,
      allPipetteData,
      getLabwareType,
      robotState,
      stepId,
    })
  }

  console.warn('allSubsteps doesn\'t support step type: ', stepArgs.stepType, stepId)
  return null
}
