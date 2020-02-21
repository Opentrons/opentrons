// @flow
import assert from 'assert'
import cloneDeep from 'lodash/cloneDeep'
import range from 'lodash/range'
import mapValues from 'lodash/mapValues'
import isEmpty from 'lodash/isEmpty'

import { substepTimeline } from './substepTimeline'
import * as steplistUtils from './utils'
import {
  consolidate,
  distribute,
  transfer,
  mix,
  curryCommandCreator,
} from '../step-generation'

import type { StepIdType } from '../form-types'
import type {
  CurriedCommandCreator,
  InvariantContext,
  RobotState,
} from '../step-generation'
import type {
  ConsolidateArgs,
  DistributeArgs,
  MixArgs,
  TransferArgs,
} from '../step-generation/types'
import type {
  NamedIngred,
  StepArgsAndErrors,
  StepItemSourceDestRow,
  SourceDestSubstepItem,
  SubstepItemData,
  SubstepTimelineFrame,
} from './types'

export type GetIngreds = (labware: string, well: string) => Array<NamedIngred>

type TransferLikeArgs =
  | ConsolidateArgs
  | DistributeArgs
  | TransferArgs
  | MixArgs

function getCommandCreatorForSubsteps(
  stepArgs: TransferLikeArgs
): CurriedCommandCreator | null {
  // Call appropriate command creator with the validateForm fields.
  // Disable any mix args so those aspirate/dispenses don't show up in substeps
  if (stepArgs.commandCreatorFnName === 'transfer') {
    const commandCallArgs = {
      ...stepArgs,
      mixBeforeAspirate: null,
      mixInDestination: null,
      preWetTip: false,
    }

    // $FlowFixMe(mc, 2020-02-21): Error from Flow 0.118 upgrade
    return curryCommandCreator(transfer, commandCallArgs)
  } else if (stepArgs.commandCreatorFnName === 'distribute') {
    const commandCallArgs = {
      ...stepArgs,
      mixBeforeAspirate: null,
      preWetTip: false,
    }

    // $FlowFixMe(mc, 2020-02-21): Error from Flow 0.118 upgrade
    return curryCommandCreator(distribute, commandCallArgs)
  } else if (stepArgs.commandCreatorFnName === 'consolidate') {
    const commandCallArgs = {
      ...stepArgs,
      mixFirstAspirate: null,
      mixInDestination: null,
      preWetTip: false,
    }

    // $FlowFixMe(mc, 2020-02-21): Error from Flow 0.118 upgrade
    return curryCommandCreator(consolidate, commandCallArgs)
  } else if (stepArgs.commandCreatorFnName === 'mix') {
    return curryCommandCreator(mix, stepArgs)
  } else {
    console.warn(
      `getStepArgsForSubsteps got unsupported stepType "${stepArgs.commandCreatorFnName}"`
    )
    return null
  }
}

export const mergeSubstepRowsSingleChannel = (args: {|
  substepRows: Array<SubstepTimelineFrame>,
  showDispenseVol: boolean,
|}): Array<StepItemSourceDestRow> => {
  const { substepRows, showDispenseVol } = args
  return steplistUtils.mergeWhen(
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
      volume: showDispenseVol ? nextRow.volume : currentRow.volume,
    }),
    currentRow => {
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
}

export const mergeSubstepRowsMultiChannel = (args: {|
  substepRows: Array<SubstepTimelineFrame>,
  channels: number,
  isMixStep: boolean,
  showDispenseVol: boolean,
|}): Array<Array<StepItemSourceDestRow>> => {
  const { substepRows, channels, isMixStep, showDispenseVol } = args
  return steplistUtils.mergeWhen(
    substepRows,
    (
      currentMultiRow: SubstepTimelineFrame,
      nextMultiRow: SubstepTimelineFrame
    ) => {
      // aspirate then dispense multirows adjacent
      // (inferring from first channel row in each multirow)
      return (
        currentMultiRow &&
        currentMultiRow.source &&
        nextMultiRow &&
        nextMultiRow.dest
      )
    },
    // Merge each channel row together when predicate true
    (currentMultiRow, nextMultiRow) => {
      return range(channels).map(channelIndex => {
        const sourceChannelWell =
          currentMultiRow.source && currentMultiRow.source.wells[channelIndex]
        const destChannelWell =
          nextMultiRow.dest && nextMultiRow.dest.wells[channelIndex]
        const source = currentMultiRow.source &&
          sourceChannelWell && {
            well: sourceChannelWell,
            preIngreds: currentMultiRow.source.preIngreds[sourceChannelWell],
            postIngreds: currentMultiRow.source.postIngreds[sourceChannelWell],
          }
        const dest = nextMultiRow.dest &&
          destChannelWell && {
            well: destChannelWell,
            preIngreds: nextMultiRow.dest.preIngreds[destChannelWell],
            postIngreds: nextMultiRow.dest.postIngreds[destChannelWell],
          }
        const activeTips = currentMultiRow.activeTips
        return {
          activeTips,
          source,
          dest: isMixStep ? source : dest, // NOTE: since source and dest are same for mix, we're showing source on both sides. Otherwise dest would show the intermediate volume state
          volume: showDispenseVol
            ? nextMultiRow.volume
            : currentMultiRow.volume,
        }
      })
    },
    currentMultiRow =>
      range(channels).map(channelIndex => {
        const source = currentMultiRow.source && {
          well: currentMultiRow.source.wells[channelIndex],
          preIngreds:
            currentMultiRow.source.preIngreds[
              currentMultiRow.source.wells[channelIndex]
            ],
          postIngreds:
            currentMultiRow.source.postIngreds[
              currentMultiRow.source.wells[channelIndex]
            ],
        }
        const dest = currentMultiRow.dest && {
          well: currentMultiRow.dest.wells[channelIndex],
          preIngreds:
            currentMultiRow.dest.preIngreds[
              currentMultiRow.dest.wells[channelIndex]
            ],
          postIngreds:
            currentMultiRow.dest.postIngreds[
              currentMultiRow.dest.wells[channelIndex]
            ],
        }
        const activeTips = currentMultiRow.activeTips
        return { activeTips, source, dest, volume: currentMultiRow.volume }
      })
  )
}

function transferLikeSubsteps(args: {|
  stepArgs: ConsolidateArgs | DistributeArgs | TransferArgs | MixArgs,
  invariantContext: InvariantContext,
  robotState: RobotState,
  stepId: StepIdType,
|}): ?SourceDestSubstepItem {
  const { stepArgs, invariantContext, stepId } = args

  // Add tips to pipettes, since this is just a "simulation"
  // TODO: Ian 2018-07-31 develop more elegant way to bypass tip handling for simulation/test
  const tipState = cloneDeep(args.robotState.tipState)
  tipState.pipettes = mapValues(tipState.pipettes, () => true)
  const initialRobotState = { ...args.robotState, tipState }
  const { pipette: pipetteId } = stepArgs

  const pipetteSpec = invariantContext.pipetteEntities[pipetteId]?.spec

  // TODO Ian 2018-04-06 use assert here
  if (!pipetteSpec) {
    assert(
      false,
      `Pipette "${pipetteId}" does not exist, step ${stepId} can't determine channels`
    )
    return null
  }

  // if false, show aspirate vol instead
  const showDispenseVol = stepArgs.commandCreatorFnName === 'distribute'

  // Call appropriate command creator with the validateForm fields.
  // Disable any mix args so those aspirate/dispenses don't show up in substeps
  const substepCommandCreator = getCommandCreatorForSubsteps(stepArgs)
  if (!substepCommandCreator) {
    assert(false, `transferLikeSubsteps could not make a command creator`)
    return null
  }

  // Multichannel substeps
  if (pipetteSpec.channels > 1) {
    const substepRows: Array<SubstepTimelineFrame> = substepTimeline(
      substepCommandCreator,
      invariantContext,
      initialRobotState,
      pipetteSpec.channels
    )

    const mergedMultiRows: Array<
      Array<StepItemSourceDestRow>
    > = mergeSubstepRowsMultiChannel({
      substepRows,
      isMixStep: stepArgs.commandCreatorFnName === 'mix',
      channels: pipetteSpec.channels,
      showDispenseVol,
    })

    return {
      substepType: 'sourceDest',
      multichannel: true,
      commandCreatorFnName: stepArgs.commandCreatorFnName,
      parentStepId: stepId,
      multiRows: mergedMultiRows,
    }
  } else {
    // single channel
    const substepRows = substepTimeline(
      substepCommandCreator,
      invariantContext,
      initialRobotState,
      1
    )

    const mergedRows: Array<StepItemSourceDestRow> = mergeSubstepRowsSingleChannel(
      { substepRows, showDispenseVol }
    )

    return {
      substepType: 'sourceDest',
      multichannel: false,
      commandCreatorFnName: stepArgs.commandCreatorFnName,
      parentStepId: stepId,
      rows: mergedRows,
    }
  }
}

// NOTE: This is the fn used by the `allSubsteps` selector
export function generateSubsteps(
  stepArgsAndErrors: ?StepArgsAndErrors,
  invariantContext: InvariantContext,
  robotState: ?RobotState,
  stepId: string,
  labwareNamesByModuleId: {
    [moduleId: string]: ?{ nickname: ?string, displayName: string },
  }
): ?SubstepItemData {
  if (!robotState) {
    console.info(
      `No robot state, could not generate substeps for step ${stepId}.` +
        `There was probably an upstream error.`
    )
    return null
  }

  // TODO: BC: 2018-08-21 replace old error check with new logic in field, form, and timeline level
  // Don't try to render with form errors. TODO LATER: presentational error state of substeps?
  if (
    !stepArgsAndErrors ||
    !stepArgsAndErrors.stepArgs ||
    !isEmpty(stepArgsAndErrors.errors)
  ) {
    return null
  }

  const { stepArgs } = stepArgsAndErrors

  if (stepArgs.commandCreatorFnName === 'delay') {
    return {
      substepType: 'pause',
      pauseStepArgs: stepArgs,
    }
  }

  if (
    stepArgs.commandCreatorFnName === 'consolidate' ||
    stepArgs.commandCreatorFnName === 'distribute' ||
    stepArgs.commandCreatorFnName === 'transfer' ||
    stepArgs.commandCreatorFnName === 'mix'
  ) {
    return transferLikeSubsteps({
      stepArgs,
      invariantContext,
      robotState,
      stepId,
    })
  }

  const labwareNames = stepArgs.module
    ? labwareNamesByModuleId[stepArgs.module]
    : null

  if (
    stepArgs.commandCreatorFnName === 'disengageMagnet' ||
    stepArgs.commandCreatorFnName === 'engageMagnet'
  ) {
    return {
      substepType: 'magnet',
      engage: stepArgs.commandCreatorFnName === 'engageMagnet',
      labwareDisplayName: labwareNames?.displayName,
      labwareNickname: labwareNames?.nickname,
      message: stepArgs.message,
    }
  }

  if (
    stepArgs.commandCreatorFnName === 'setTemperature' ||
    stepArgs.commandCreatorFnName === 'deactivateTemperature'
  ) {
    const temperature =
      stepArgs.commandCreatorFnName === 'setTemperature'
        ? stepArgs.targetTemperature
        : null

    return {
      substepType: 'temperature',
      temperature: temperature,
      labwareDisplayName: labwareNames?.displayName,
      labwareNickname: labwareNames?.nickname,
      message: stepArgs.message,
    }
  }

  if (stepArgs.commandCreatorFnName === 'awaitTemperature') {
    return {
      substepType: 'awaitTemperature',
      temperature: stepArgs.temperature,
      labwareDisplayName: labwareNames?.displayName,
      labwareNickname: labwareNames?.nickname,
      message: stepArgs.message,
    }
  }

  console.warn(
    "allSubsteps doesn't support commandCreatorFnName: ",
    stepArgs.commandCreatorFnName,
    stepId
  )
  return null
}
