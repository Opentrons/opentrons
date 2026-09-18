import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'

import { COLUMN } from '@opentrons/shared-data'
import {
  consolidate,
  curryCommandCreator,
  distribute,
  mix,
  transfer,
} from '@opentrons/step-generation'

import { THERMOCYCLER_PROFILE, THERMOCYCLER_STATE } from '../constants'
import {
  substepTimelineMultiChannel,
  substepTimelineSingleChannel,
} from './substepTimeline'
import { mergeWhen } from './utils/mergeWhen'

import type {
  ConsolidateArgs,
  CurriedCommandCreator,
  DistributeArgs,
  InvariantContext,
  MixArgs,
  RobotState,
  TransferArgs,
} from '@opentrons/step-generation'
import type { StepIdType } from '../form-types'
import type {
  LabwareNamesByModuleId,
  NamedIngred,
  SourceDestSubstepItem,
  StepArgsAndErrors,
  StepItemSourceDestRow,
  SubstepItemData,
  SubstepTimelineFrame,
  SubstepWellData,
} from './types'

export type GetIngreds = (labware: string, well: string) => NamedIngred[]
type TransferLikeArgs =
  ConsolidateArgs | DistributeArgs | TransferArgs | MixArgs

function getCommandCreatorForTransferlikeSubsteps(
  stepArgs: TransferLikeArgs
): CurriedCommandCreator | null {
  // Call appropriate command creator with the validateForm fields.
  // Disable any mix args so those aspirate/dispenses don't show up in substeps
  if (stepArgs.commandCreatorFnName === 'transfer') {
    const commandCallArgs = {
      ...stepArgs,
      // TODO(IL, 2020-02-24): Flow is refusing to infer these when we
      // spread `...stepArgs` above, so for now, they have to be redundantly explicit
      blowoutFlowRateUlSec: stepArgs.blowoutFlowRateUlSec,
      blowoutLocation: stepArgs.blowoutLocation,
      commandCreatorFnName: stepArgs.commandCreatorFnName,
      destWells: stepArgs.destWells,
      sourceWells: stepArgs.sourceWells,
      // set special values for substeps
      mixBeforeAspirate: null,
      mixInDestination: null,
      preWetTip: false,
      tiprack: stepArgs.tipRack,
    }
    return curryCommandCreator(transfer, commandCallArgs)
  } else if (stepArgs.commandCreatorFnName === 'distribute') {
    const commandCallArgs = {
      ...stepArgs,
      // TODO(IL, 2020-02-24): Flow is refusing to infer these when we
      // spread `...stepArgs` above, so for now, they have to be redundantly explicit
      blowoutFlowRateUlSec: stepArgs.blowoutFlowRateUlSec,
      commandCreatorFnName: stepArgs.commandCreatorFnName,
      destWells: stepArgs.destWells,
      disposalVolume: stepArgs.disposalVolume,
      sourceWell: stepArgs.sourceWell,
      // set special values for substeps
      mixBeforeAspirate: null,
      preWetTip: false,
      tiprack: stepArgs.tipRack,
    }
    return curryCommandCreator(distribute, commandCallArgs)
  } else if (stepArgs.commandCreatorFnName === 'consolidate') {
    const commandCallArgs = {
      ...stepArgs,
      // TODO(IL, 2020-02-24): Flow is refusing to infer these when we
      // spread `...stepArgs` above, so for now, they have to be redundantly explicit
      blowoutFlowRateUlSec: stepArgs.blowoutFlowRateUlSec,
      blowoutLocation: stepArgs.blowoutLocation,
      commandCreatorFnName: stepArgs.commandCreatorFnName,
      destWell: stepArgs.destWell,
      sourceWells: stepArgs.sourceWells,
      // set special values for substeps
      mixFirstAspirate: null,
      mixInDestination: null,
      preWetTip: false,
      tiprack: stepArgs.tipRack,
    }
    return curryCommandCreator(consolidate, commandCallArgs)
  } else if (stepArgs.commandCreatorFnName === 'mix') {
    return curryCommandCreator(mix, stepArgs)
  } else {
    console.warn(
      // @ts-expect-error(sa, 2021-6-14): I don't think this case can ever happen, so stepArgs.commandCreatorFnName gets never typed
      `getStepArgsForSubsteps got unsupported stepType "${stepArgs.commandCreatorFnName}"`
    )
    return null
  }
}

export const mergeSubstepRowsSingleChannel = (args: {
  substepRows: SubstepTimelineFrame[]
  showDispenseVol: boolean
}): StepItemSourceDestRow[] => {
  const { substepRows, showDispenseVol } = args
  return mergeWhen(
    substepRows,
    (
      currentRow,
      nextRow // NOTE: if aspirate then dispense rows are adjacent, collapse them into one row
    ) => currentRow.source && nextRow.dest,
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
      aspirateVolume: currentRow.volume ?? null,
      dispenseVolume: nextRow.volume ?? null,
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
export const mergeSubstepRowsMultiChannel = (args: {
  substepRows: SubstepTimelineFrame[]
  channels: number
  isMixStep: boolean
  showDispenseVol: boolean
}): StepItemSourceDestRow[][] => {
  const { substepRows, channels, isMixStep, showDispenseVol } = args
  const mergedRows = substepRows.reduce<StepItemSourceDestRow[][]>(
    (acc, _, index) => {
      if (index % channels !== 0) {
        return acc
      }

      const chunk = substepRows.slice(index, index + channels)

      const row = range(chunk.length).map(channelIndex => {
        const step = chunk[channelIndex]
        const wellNameSource = step?.source?.wells?.[0]
        const wellNameDest = step?.dest?.wells?.[0]

        const source: SubstepWellData | undefined =
          wellNameSource != null
            ? {
                well: wellNameSource,
                preIngreds: step.source?.preIngreds ?? {},
                postIngreds: step.source?.postIngreds ?? {},
              }
            : undefined

        const dest: SubstepWellData | undefined =
          wellNameDest != null
            ? {
                well: wellNameDest,
                preIngreds: step.dest?.preIngreds ?? {},
                postIngreds: step.dest?.postIngreds ?? {},
              }
            : undefined

        return {
          activeTips: step.activeTips,
          source,
          dest: isMixStep ? source : dest,
          volume: showDispenseVol ? step.volume : step.volume,
        }
      })
      //  this is for a mixing step
      const hasNoSourceOrDest = row.every(
        ({ source, dest }) => source === undefined && dest === undefined
      )

      if (!hasNoSourceOrDest) {
        acc.push(row)
      }

      return acc
    },
    []
  )

  return mergedRows
}

function transferLikeSubsteps(args: {
  stepArgs: ConsolidateArgs | DistributeArgs | TransferArgs | MixArgs
  invariantContext: InvariantContext
  robotState: RobotState
  stepId: StepIdType
}): SourceDestSubstepItem | null | undefined {
  const { stepArgs, invariantContext, stepId } = args
  // Add tips to pipettes, since this is just a "simulation"
  // TODO: Ian 2018-07-31 develop more elegant way to bypass tip handling for simulation/test
  const tipState = cloneDeep(args.robotState.tipState)
  tipState.pipettes = mapValues(tipState.pipettes, () => {
    return { hasTip: true, tiprackURI: '' } // arbitrary tip URI
  })
  const initialRobotState = { ...args.robotState, tipState }
  const { pipette: pipetteId } = stepArgs
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId]?.spec

  // TODO Ian 2018-04-06 use assert here
  if (!pipetteSpec) {
    console.assert(
      false,
      `Pipette "${pipetteId}" does not exist, step ${stepId} can't determine channels`
    )
    return null
  }

  // if false, show aspirate vol instead
  const showDispenseVol = stepArgs.commandCreatorFnName === 'distribute'
  // Call appropriate command creator with the validateForm fields.
  // Disable any mix args so those aspirate/dispenses don't show up in substeps
  const substepCommandCreator =
    getCommandCreatorForTransferlikeSubsteps(stepArgs)

  if (!substepCommandCreator) {
    console.assert(
      false,
      `transferLikeSubsteps could not make a command creator`
    )
    return null
  }

  let channels = pipetteSpec.channels
  if (stepArgs.nozzles === COLUMN && channels === 96) {
    channels = 8
  }
  // Multichannel substeps
  if (pipetteSpec.channels > 1) {
    const substepRows = substepTimelineMultiChannel(
      substepCommandCreator,
      invariantContext,
      initialRobotState
    )
    const mergedMultiRows: StepItemSourceDestRow[][] =
      mergeSubstepRowsMultiChannel({
        substepRows,
        isMixStep: stepArgs.commandCreatorFnName === 'mix',
        channels,
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
    const substepRows = substepTimelineSingleChannel(
      substepCommandCreator,
      invariantContext,
      initialRobotState
    )
    const mergedRows: StepItemSourceDestRow[] = mergeSubstepRowsSingleChannel({
      substepRows,
      showDispenseVol,
    })

    return {
      substepType: 'sourceDest',
      multichannel: false,
      commandCreatorFnName: stepArgs.commandCreatorFnName,
      parentStepId: stepId,
      rows: mergedRows,
    }
  }
}

export function generateSubstepItem(
  stepArgsAndErrors: StepArgsAndErrors | null | undefined,
  invariantContext: InvariantContext,
  robotState: RobotState | null | undefined,
  stepId: string,
  labwareNamesByModuleId: LabwareNamesByModuleId
): SubstepItemData | null | undefined {
  if (!robotState) {
    console.warn(
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

  if (stepArgs.commandCreatorFnName === THERMOCYCLER_PROFILE) {
    return {
      substepType: THERMOCYCLER_PROFILE,
    }
  }

  if (stepArgs.commandCreatorFnName === THERMOCYCLER_STATE) {
    const labwareNames = stepArgs.moduleId
      ? labwareNamesByModuleId[stepArgs.moduleId]
      : null

    return {
      substepType: THERMOCYCLER_STATE,
      labwareNickname: labwareNames?.nickname,
      blockTargetTemp: stepArgs.blockTargetTemp,
      lidTargetTemp: stepArgs.lidTargetTemp,
      lidOpen: stepArgs.lidOpen,
      message: stepArgs.message,
    }
  }
  return null
}
