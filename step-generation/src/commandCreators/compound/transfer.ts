import assert from 'assert'
import zip from 'lodash/zip'
import { getWellDepth } from '@opentrons/shared-data'
import { AIR_GAP_OFFSET_FROM_TOP } from '../../constants'
import * as errorCreators from '../../errorCreators'
import { getPipetteWithTipMaxVol } from '../../robotStateSelectors'
import {
  blowoutUtil,
  curryCommandCreator,
  getDispenseAirGapLocation,
  reduceCommandCreators,
  wasteChuteCommandsUtil,
} from '../../utils'
import {
  aspirate,
  delay,
  dispense,
  dropTip,
  replaceTip,
  touchTip,
  moveToWell,
} from '../atomic'
import { configureForVolume } from '../atomic/configureForVolume'
import { mixUtil } from './mix'
import type {
  TransferArgs,
  CurriedCommandCreator,
  CommandCreator,
  CommandCreatorError,
} from '../../types'
export const transfer: CommandCreator<TransferArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /**
    Transfer will iterate through a set of 1 or more source and destination wells.
    For each pair, it will aspirate from the source well, then dispense into the destination well.
    This pair of 1 source well and 1 dest well is internally called a "sub-transfer".
     If the volume to aspirate from a source well exceeds the max volume of the pipette,
    then each sub-transfer will be chunked into multiple asp-disp, asp-disp commands.
     A single uniform volume will be aspirated from every source well and dispensed into every dest well.
    In other words, all the sub-transfers will use the same uniform volume.
     =====
     For transfer, changeTip means:
    * 'always': before each aspirate, get a fresh tip
    * 'once': get a new tip at the beginning of the transfer step, and use it throughout
    * 'never': reuse the tip from the last step
    * 'perSource': change tip each time you encounter a new source well (including the first one)
    * 'perDest': change tip each time you encounter a new destination well (including the first one)
    NOTE: In some situations, different changeTip options have equivalent outcomes. That's OK.
  */
  assert(
    args.sourceWells.length === args.destWells.length,
    `Transfer command creator expected N:N source-to-dest wells ratio. Got ${args.sourceWells.length}:${args.destWells.length}`
  )
  // TODO Ian 2018-04-02 following ~10 lines are identical to first lines of consolidate.js...
  const actionName = 'transfer'
  const errors: CommandCreatorError[] = []

  if (
    !prevRobotState.pipettes[args.pipette] ||
    !invariantContext.pipetteEntities[args.pipette]
  ) {
    // bail out before doing anything else
    errors.push(
      errorCreators.pipetteDoesNotExist({
        actionName,
        pipette: args.pipette,
      })
    )
  }

  if (!args.sourceLabware || !prevRobotState.labware[args.sourceLabware]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware: args.sourceLabware,
      })
    )
  }

  if (
    !invariantContext.labwareEntities[args.dropTipLocation] &&
    !invariantContext.additionalEquipmentEntities[args.dropTipLocation]
  ) {
    errors.push(errorCreators.dropTipLocationDoesNotExist())
  }

  if (errors.length > 0)
    return {
      errors,
    }
  const pipetteSpec = invariantContext.pipetteEntities[args.pipette].spec

  const isWasteChute =
    invariantContext.additionalEquipmentEntities[args.dropTipLocation] != null

  const addressableAreaName =
    pipetteSpec.channels === 96
      ? '96ChannelWasteChute'
      : '1and8ChannelWasteChute'

  const dropTipCommand = isWasteChute
    ? curryCommandCreator(wasteChuteCommandsUtil, {
        type: 'dropTip',
        pipetteId: args.pipette,
        addressableAreaName: addressableAreaName,
      })
    : curryCommandCreator(dropTip, {
        pipette: args.pipette,
        dropTipLocation: args.dropTipLocation,
      })

  // TODO: BC 2019-07-08 these argument names are a bit misleading, instead of being values bound
  // to the action of aspiration of dispensing in a given command, they are actually values bound
  // to a given labware associated with a command (e.g. Source, Destination). For this reason we
  // currently remapping the inner mix values. Those calls to mixUtil should become easier to read
  // when we decide to rename these fields/args... probably all the way up to the UI level.
  const {
    aspirateDelay,
    dispenseDelay,
    aspirateFlowRateUlSec,
    aspirateOffsetFromBottomMm,
    blowoutFlowRateUlSec,
    blowoutOffsetFromTopMm,
    dispenseFlowRateUlSec,
    dispenseOffsetFromBottomMm,
  } = args
  const aspirateAirGapVolume = args.aspirateAirGapVolume || 0
  const dispenseAirGapVolume = args.dispenseAirGapVolume || 0
  const effectiveTransferVol =
    getPipetteWithTipMaxVol(args.pipette, invariantContext) -
    aspirateAirGapVolume
  const pipetteMinVol = pipetteSpec.minVolume
  const chunksPerSubTransfer = Math.ceil(args.volume / effectiveTransferVol)
  const lastSubTransferVol =
    args.volume - (chunksPerSubTransfer - 1) * effectiveTransferVol
  // volume of each chunk in a sub-transfer
  let subTransferVolumes: number[] = Array(chunksPerSubTransfer - 1)
    .fill(effectiveTransferVol)
    .concat(lastSubTransferVol)

  if (chunksPerSubTransfer > 1 && lastSubTransferVol < pipetteMinVol) {
    // last chunk volume is below pipette min, split the last
    const splitLastVol = (effectiveTransferVol + lastSubTransferVol) / 2
    subTransferVolumes = Array(chunksPerSubTransfer - 2)
      .fill(effectiveTransferVol)
      .concat(splitLastVol)
      .concat(splitLastVol)
  }
  // @ts-expect-error(SA, 2021-05-05): zip can return undefined so this really should be Array<[string | undefined, string | undefined]>
  const sourceDestPairs: Array<[string, string]> = zip(
    args.sourceWells,
    args.destWells
  )
  let prevSourceWell: string | null = null
  let prevDestWell: string | null = null
  const commandCreators = sourceDestPairs.reduce(
    (
      outerAcc: CurriedCommandCreator[],
      wellPair: [string, string],
      pairIdx: number
    ): CurriedCommandCreator[] => {
      const [sourceWell, destWell] = wellPair
      const sourceLabwareDef =
        invariantContext.labwareEntities[args.sourceLabware].def
      const destLabwareDef =
        invariantContext.labwareEntities[args.destLabware].def
      const airGapOffsetSourceWell =
        getWellDepth(sourceLabwareDef, sourceWell) + AIR_GAP_OFFSET_FROM_TOP
      const airGapOffsetDestWell =
        getWellDepth(destLabwareDef, destWell) + AIR_GAP_OFFSET_FROM_TOP
      const commands = subTransferVolumes.reduce(
        (
          innerAcc: CurriedCommandCreator[],
          subTransferVol: number,
          chunkIdx: number
        ): CurriedCommandCreator[] => {
          const isInitialSubtransfer = pairIdx === 0 && chunkIdx === 0
          const isLastPair = pairIdx + 1 === sourceDestPairs.length
          const isLastChunk = chunkIdx + 1 === subTransferVolumes.length
          let changeTipNow = false // 'never' by default

          if (args.changeTip === 'always') {
            changeTipNow = true
          } else if (args.changeTip === 'once') {
            changeTipNow = isInitialSubtransfer
          } else if (args.changeTip === 'perSource') {
            changeTipNow = sourceWell !== prevSourceWell
          } else if (args.changeTip === 'perDest') {
            changeTipNow = isInitialSubtransfer || destWell !== prevDestWell
          }

          const configureForVolumeCommand: CurriedCommandCreator[] =
            invariantContext.pipetteEntities[args.pipette].name ===
              'p50_single_flex' ||
            invariantContext.pipetteEntities[args.pipette].name ===
              'p50_multi_flex'
              ? [
                  curryCommandCreator(configureForVolume, {
                    pipetteId: args.pipette,
                    volume: args.volume,
                  }),
                ]
              : []

          const tipCommands: CurriedCommandCreator[] = changeTipNow
            ? [
                curryCommandCreator(replaceTip, {
                  pipette: args.pipette,
                  dropTipLocation: args.dropTipLocation,
                }),
              ]
            : []
          const preWetTipCommands =
            args.preWetTip && chunkIdx === 0
              ? mixUtil({
                  pipette: args.pipette,
                  labware: args.sourceLabware,
                  well: sourceWell,
                  volume: Math.max(subTransferVol),
                  times: 1,
                  aspirateOffsetFromBottomMm,
                  dispenseOffsetFromBottomMm: aspirateOffsetFromBottomMm,
                  aspirateFlowRateUlSec,
                  dispenseFlowRateUlSec,
                  aspirateDelaySeconds: aspirateDelay?.seconds,
                  dispenseDelaySeconds: dispenseDelay?.seconds,
                })
              : []
          const mixBeforeAspirateCommands =
            args.mixBeforeAspirate != null
              ? mixUtil({
                  pipette: args.pipette,
                  labware: args.sourceLabware,
                  well: sourceWell,
                  volume: args.mixBeforeAspirate.volume,
                  times: args.mixBeforeAspirate.times,
                  aspirateOffsetFromBottomMm,
                  dispenseOffsetFromBottomMm: aspirateOffsetFromBottomMm,
                  aspirateFlowRateUlSec,
                  dispenseFlowRateUlSec,
                  aspirateDelaySeconds: aspirateDelay?.seconds,
                  dispenseDelaySeconds: dispenseDelay?.seconds,
                })
              : []
          const delayAfterAspirateCommands =
            aspirateDelay != null
              ? [
                  curryCommandCreator(moveToWell, {
                    pipette: args.pipette,
                    labware: args.sourceLabware,
                    well: sourceWell,
                    offset: {
                      x: 0,
                      y: 0,
                      z: aspirateDelay.mmFromBottom,
                    },
                  }),
                  curryCommandCreator(delay, {
                    commandCreatorFnName: 'delay',
                    description: null,
                    name: null,
                    meta: null,
                    wait: aspirateDelay.seconds,
                  }),
                ]
              : []
          const touchTipAfterAspirateCommands = args.touchTipAfterAspirate
            ? [
                curryCommandCreator(touchTip, {
                  pipette: args.pipette,
                  labware: args.sourceLabware,
                  well: sourceWell,
                  offsetFromBottomMm:
                    args.touchTipAfterAspirateOffsetMmFromBottom,
                }),
              ]
            : []
          const touchTipAfterDispenseCommands = args.touchTipAfterDispense
            ? [
                curryCommandCreator(touchTip, {
                  pipette: args.pipette,
                  labware: args.destLabware,
                  well: destWell,
                  offsetFromBottomMm:
                    args.touchTipAfterDispenseOffsetMmFromBottom,
                }),
              ]
            : []
          const mixInDestinationCommands =
            args.mixInDestination != null
              ? mixUtil({
                  pipette: args.pipette,
                  labware: args.destLabware,
                  well: destWell,
                  volume: args.mixInDestination.volume,
                  times: args.mixInDestination.times,
                  aspirateOffsetFromBottomMm: dispenseOffsetFromBottomMm,
                  dispenseOffsetFromBottomMm,
                  aspirateFlowRateUlSec,
                  dispenseFlowRateUlSec,
                  aspirateDelaySeconds: aspirateDelay?.seconds,
                  dispenseDelaySeconds: dispenseDelay?.seconds,
                })
              : []
          const delayAfterDispenseCommands =
            dispenseDelay != null
              ? [
                  curryCommandCreator(moveToWell, {
                    pipette: args.pipette,
                    labware: args.destLabware,
                    well: destWell,
                    offset: {
                      x: 0,
                      y: 0,
                      z: dispenseDelay.mmFromBottom,
                    },
                  }),
                  curryCommandCreator(delay, {
                    commandCreatorFnName: 'delay',
                    description: null,
                    name: null,
                    meta: null,
                    wait: dispenseDelay.seconds,
                  }),
                ]
              : []
          const airGapAfterAspirateCommands = aspirateAirGapVolume
            ? [
                curryCommandCreator(aspirate, {
                  pipette: args.pipette,
                  volume: aspirateAirGapVolume,
                  labware: args.sourceLabware,
                  well: sourceWell,
                  flowRate: aspirateFlowRateUlSec,
                  offsetFromBottomMm: airGapOffsetSourceWell,
                  isAirGap: true,
                }),
                ...(aspirateDelay != null
                  ? [
                      curryCommandCreator(delay, {
                        commandCreatorFnName: 'delay',
                        description: null,
                        name: null,
                        meta: null,
                        wait: aspirateDelay.seconds,
                      }),
                    ]
                  : []),
                curryCommandCreator(dispense, {
                  pipette: args.pipette,
                  volume: aspirateAirGapVolume,
                  labware: args.destLabware,
                  well: destWell,
                  flowRate: dispenseFlowRateUlSec,
                  offsetFromBottomMm: airGapOffsetDestWell,
                  isAirGap: true,
                }),
                ...(dispenseDelay != null
                  ? [
                      curryCommandCreator(delay, {
                        commandCreatorFnName: 'delay',
                        description: null,
                        name: null,
                        meta: null,
                        wait: dispenseDelay.seconds,
                      }),
                    ]
                  : []),
              ]
            : []
          // `willReuseTip` is like changeTipNow, but thinking ahead about
          //  the NEXT subtransfer and not this current one
          let willReuseTip = true // never or once --> true

          if (isLastChunk && isLastPair) {
            // if we're at the end of this step, we won't reuse the tip in this step
            // so we can discard it (even if changeTip is never, we'll drop it!)
            willReuseTip = false
          } else if (args.changeTip === 'always') {
            willReuseTip = false
          } else if (args.changeTip === 'perSource' && !isLastPair) {
            const nextSourceWell = sourceDestPairs[pairIdx + 1][0]
            willReuseTip = nextSourceWell === sourceWell
          } else if (args.changeTip === 'perDest' && !isLastPair) {
            const nextDestWell = sourceDestPairs[pairIdx + 1][1]
            willReuseTip = nextDestWell === destWell
          }

          // TODO(IL, 2020-10-12): extract this ^ into a util to reuse in distribute/consolidate??
          const {
            dispenseAirGapLabware,
            dispenseAirGapWell,
          } = getDispenseAirGapLocation({
            blowoutLocation: args.blowoutLocation,
            sourceLabware: args.sourceLabware,
            destLabware: args.destLabware,
            sourceWell,
            destWell,
          })
          const airGapAfterDispenseCommands =
            dispenseAirGapVolume && !willReuseTip
              ? [
                  curryCommandCreator(aspirate, {
                    pipette: args.pipette,
                    volume: dispenseAirGapVolume,
                    labware: dispenseAirGapLabware,
                    well: dispenseAirGapWell,
                    flowRate: aspirateFlowRateUlSec,
                    offsetFromBottomMm: airGapOffsetDestWell,
                    isAirGap: true,
                  }),
                  ...(aspirateDelay != null
                    ? [
                        curryCommandCreator(delay, {
                          commandCreatorFnName: 'delay',
                          description: null,
                          name: null,
                          meta: null,
                          wait: aspirateDelay.seconds,
                        }),
                      ]
                    : []),
                ]
              : []
          // if using dispense > air gap, drop or change the tip at the end
          const dropTipAfterDispenseAirGap =
            airGapAfterDispenseCommands.length > 0 && isLastChunk && isLastPair
              ? [dropTipCommand]
              : []
          const blowoutCommand = blowoutUtil({
            pipette: args.pipette,
            sourceLabwareId: args.sourceLabware,
            sourceWell: sourceWell,
            destLabwareId: args.destLabware,
            destWell: destWell,
            blowoutLocation: args.blowoutLocation,
            flowRate: blowoutFlowRateUlSec,
            offsetFromTopMm: blowoutOffsetFromTopMm,
            invariantContext,
          })
          const nextCommands = [
            ...tipCommands,
            ...preWetTipCommands,
            ...mixBeforeAspirateCommands,
            ...configureForVolumeCommand,
            curryCommandCreator(aspirate, {
              pipette: args.pipette,
              volume: subTransferVol,
              labware: args.sourceLabware,
              well: sourceWell,
              flowRate: aspirateFlowRateUlSec,
              offsetFromBottomMm: aspirateOffsetFromBottomMm,
            }),
            ...delayAfterAspirateCommands,
            ...touchTipAfterAspirateCommands,
            ...airGapAfterAspirateCommands,
            curryCommandCreator(dispense, {
              pipette: args.pipette,
              volume: subTransferVol,
              labware: args.destLabware,
              well: destWell,
              flowRate: dispenseFlowRateUlSec,
              offsetFromBottomMm: dispenseOffsetFromBottomMm,
            }),
            ...delayAfterDispenseCommands,
            ...mixInDestinationCommands,
            ...touchTipAfterDispenseCommands,
            ...blowoutCommand,
            ...airGapAfterDispenseCommands,
            ...dropTipAfterDispenseAirGap,
          ]
          // NOTE: side-effecting
          prevSourceWell = sourceWell
          prevDestWell = destWell
          return [...innerAcc, ...nextCommands]
        },
        []
      )
      return [...outerAcc, ...commands]
    },
    []
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
