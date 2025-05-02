import assert from 'assert'
import zip from 'lodash/zip'

import {
  getMmFromBottom,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  LOW_VOLUME_PIPETTES,
  POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
  WELL_ORIGIN_TOP,
} from '@opentrons/shared-data'

import { AIR_GAP_OFFSET_FROM_TOP } from '../../constants'
import * as errorCreators from '../../errorCreators'
import { getPipetteWithTipMaxVol } from '../../robotStateSelectors'
import {
  airGapLocationHelper,
  blowoutLocationHelper,
  curryCommandCreator,
  delayLocationHelper,
  dispenseLocationHelper,
  getTrashOrLabware,
  reduceCommandCreators,
} from '../../utils'
import {
  airGapInPlace,
  aspirateInPlace,
  configureForVolume,
  delay,
  dispense,
  dispenseInPlace,
  dropTip,
  liquidProbe,
  moveToWell,
  prepareToAspirate,
  touchTip,
} from '../atomic'
import { dropTipInTrash } from './dropTipInTrash'
import { dropTipInWasteChute } from './dropTipInWasteChute'
import { mixInPlaceUtil, mixUtil } from './mix'
import { replaceTip } from './replaceTip'

import type { CutoutId, WellLocation } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  CurriedCommandCreator,
  TransferArgs,
} from '../../types'

const SAFE_MOVE_TO_WELL_LOCATION: WellLocation = {
  origin: WELL_ORIGIN_TOP,
  offset: {
    x: 0,
    y: 0,
    z: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
  },
}

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

  // TODO: BC 2019-07-08 these argument names are a bit misleading, instead of being values bound
  // to the action of aspiration of dispensing in a given command, they are actually values bound
  // to a given labware associated with a command (e.g. Source, Destination). For this reason we
  // currently remapping the inner mix values. Those calls to mixUtil should become easier to read
  // when we decide to rename these fields/args... probably all the way up to the UI level.
  const {
    aspirateDelay,
    dispenseDelay,
    aspirateFlowRateUlSec,
    blowoutFlowRateUlSec,
    blowoutOffsetFromTopMm,
    dispenseFlowRateUlSec,
    dispenseOffsetFromBottomMm,
    tipRack,
    aspirateXOffset,
    aspirateYOffset,
    aspirateZOffset,
    destLabware,
    sourceLabware,
    dispenseXOffset,
    dispenseYOffset,
    pushOut,
    aspiratePositionReference,
    aspirateSubmergeXOffset,
    aspirateSubmergeYOffset,
    aspirateSubmergeZOffset,
    aspirateSubmergePositionReference,
    aspirateSubmergeDelay,
    aspirateRetractXOffset,
    aspirateRetractYOffset,
    aspirateRetractZOffset,
    aspirateRetractPositionReference,
    aspirateRetractDelay,
  } = args

  const trashOrLabware = getTrashOrLabware(
    invariantContext.labwareEntities,
    invariantContext.wasteChuteEntities,
    invariantContext.trashBinEntities,
    args.destLabware
  )

  if (
    (trashOrLabware === 'labware' &&
      args.destWells != null &&
      args.sourceWells.length === args.destWells.length) ||
    ((trashOrLabware === 'wasteChute' || trashOrLabware === 'trashBin') &&
      args.destWells == null &&
      args.sourceWells.length >= 1)
  ) {
    // No assertion failure, continue with the logic
  } else {
    assert(
      false,
      `Transfer command creator expected N:N source-to-dest wells ratio. Got ${args.sourceWells.length}:${args.destWells?.length} in labware`
    )
  }

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

  const initialDestLabwareSlot = prevRobotState.labware[destLabware]?.slot
  const initialSourceLabwareSlot = prevRobotState.labware[sourceLabware]?.slot
  const hasWasteChute =
    Object.keys(invariantContext.wasteChuteEntities).length > 0

  const isWasteChute =
    invariantContext.wasteChuteEntities[args.dropTipLocation] != null
  const isTrashBin =
    invariantContext.trashBinEntities[args.dropTipLocation] != null

  if (
    hasWasteChute &&
    (initialDestLabwareSlot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA ||
      initialSourceLabwareSlot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA)
  ) {
    errors.push(errorCreators.labwareDiscarded())
  }

  if (
    !args.destLabware ||
    (!invariantContext.labwareEntities[args.destLabware] &&
      !invariantContext.wasteChuteEntities[args.destLabware] &&
      !invariantContext.trashBinEntities[args.destLabware])
  ) {
    errors.push(errorCreators.equipmentDoesNotExist())
  }

  if (!args.dropTipLocation || (!isWasteChute && !isTrashBin)) {
    errors.push(errorCreators.dropTipLocationDoesNotExist())
  }

  if (errors.length > 0)
    return {
      errors,
    }
  const pipetteSpec = invariantContext.pipetteEntities[args.pipette].spec

  const aspirateAirGapVolume = args.aspirateAirGapVolume || 0
  const dispenseAirGapVolume = args.dispenseAirGapVolume || 0
  const effectiveTransferVol =
    getPipetteWithTipMaxVol(args.pipette, invariantContext, tipRack) -
    aspirateAirGapVolume
  const liquidMinVolumes = Object.values(pipetteSpec.liquids).map(
    liquid => liquid.minVolume
  )
  //  account for minVolume for lowVolume pipettes
  const pipetteMinVol = Math.min(...liquidMinVolumes)
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

  const aspirateSubmergeLocation: WellLocation = {
    origin:
      POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN[
        aspirateSubmergePositionReference
      ],
    offset: {
      x: aspirateSubmergeXOffset,
      y: aspirateSubmergeYOffset,
      z: aspirateSubmergeZOffset,
    },
  }
  const aspirateRetractLocation: WellLocation = {
    origin:
      POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN[
        aspirateRetractPositionReference
      ],
    offset: {
      x: aspirateRetractXOffset,
      y: aspirateRetractYOffset,
      z: aspirateRetractZOffset,
    },
  }
  // @ts-expect-error(SA, 2021-05-05): zip can return undefined so this really should be Array<[string | undefined, string | undefined]>
  const sourceDestPairs: Array<[string, string | null]> = zip(
    args.sourceWells,
    args.destWells
  )
  let prevSourceWell: string | null = null
  let prevDestWell: string | null = null
  const probedWells: Set<string> = new Set()
  const commandCreators = sourceDestPairs.reduce(
    (
      outerAcc: CurriedCommandCreator[],
      wellPair: [string, string | null],
      pairIdx: number
    ): CurriedCommandCreator[] => {
      const [sourceWell, destinationWell] = wellPair
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
            changeTipNow =
              isInitialSubtransfer || destinationWell !== prevDestWell
          }

          const configureForVolumeCommand = LOW_VOLUME_PIPETTES.includes(
            invariantContext.pipetteEntities[args.pipette].name
          )
            ? [
                curryCommandCreator(configureForVolume, {
                  pipetteId: args.pipette,
                  volume: subTransferVol,
                }),
              ]
            : []

          const tipCommands = changeTipNow
            ? [
                curryCommandCreator(replaceTip, {
                  pipette: args.pipette,
                  nozzles: args.nozzles ?? undefined,
                  dropTipLocation: args.dropTipLocation,
                  tipRack: args.tipRack,
                }),
              ]
            : []

          const wellDepth =
            invariantContext.labwareEntities[sourceLabware]?.def.wells[
              sourceWell
            ]?.depth ?? null
          const aspirateMmFromBottom = getMmFromBottom(
            aspirateZOffset,
            aspiratePositionReference,
            wellDepth
          )
          const aspirateSubmergeMmFromBottom = getMmFromBottom(
            aspirateSubmergeZOffset,
            aspirateSubmergePositionReference,
            wellDepth
          )
          const aspirateRetractMmFromBottom = getMmFromBottom(
            aspirateRetractZOffset,
            aspirateRetractPositionReference,
            wellDepth
          )
          if (
            aspirateMmFromBottom != null &&
            aspirateSubmergeMmFromBottom != null &&
            aspirateMmFromBottom >= aspirateSubmergeMmFromBottom
          ) {
            errors.push(errorCreators.submergeBelowAspirate())
          }
          if (
            aspirateMmFromBottom != null &&
            aspirateRetractMmFromBottom != null &&
            aspirateMmFromBottom >= aspirateRetractMmFromBottom
          ) {
            errors.push(errorCreators.retractBelowAspirate())
          }

          const moveToSourceWellTopCommand = [
            curryCommandCreator(moveToWell, {
              pipetteId: args.pipette,
              labwareId: args.sourceLabware,
              wellName: sourceWell,
              wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
            }),
          ]
          let liquidProbeCommand: CurriedCommandCreator[] = []
          if (changeTipNow && !probedWells.has(sourceWell)) {
            liquidProbeCommand = [
              curryCommandCreator(liquidProbe, {
                pipetteId: args.pipette,
                labwareId: args.sourceLabware,
                wellName: sourceWell,
                wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
              }),
            ]
            probedWells.add(sourceWell)
          }
          const prepareToAspirateCommand = [
            curryCommandCreator(prepareToAspirate, {
              pipetteId: args.pipette,
            }),
          ]
          const voidDispenseAirGapCommand =
            dispenseAirGapVolume > 0 &&
            !changeTipNow &&
            (chunkIdx > 0 || pairIdx > 0)
              ? [
                  curryCommandCreator(dispenseInPlace, {
                    pipetteId: args.pipette,
                    volume: dispenseAirGapVolume,
                    flowRate: dispenseFlowRateUlSec,
                  }),
                ]
              : []
          const preAspirateSubmergeCommands = [
            ...moveToSourceWellTopCommand,
            ...voidDispenseAirGapCommand,
            ...liquidProbeCommand,
            ...configureForVolumeCommand,
            ...prepareToAspirateCommand,
          ]
          const aspirateSubmergeCommands = [
            curryCommandCreator(moveToWell, {
              pipetteId: args.pipette,
              labwareId: args.sourceLabware,
              wellName: sourceWell,
              wellLocation: aspirateSubmergeLocation,
            }),
            ...(aspirateSubmergeDelay != null &&
            aspirateSubmergeDelay.seconds > 0
              ? [
                  curryCommandCreator(delay, {
                    seconds: aspirateSubmergeDelay.seconds,
                  }),
                ]
              : []),
            curryCommandCreator(moveToWell, {
              pipetteId: args.pipette,
              labwareId: args.sourceLabware,
              ...(args.aspirateSubmergeSpeed != null
                ? { speed: args.aspirateSubmergeSpeed }
                : {}),
              wellName: sourceWell,
              wellLocation: {
                origin:
                  POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN[
                    args.aspiratePositionReference
                  ],
                offset: {
                  x: aspirateXOffset,
                  y: aspirateYOffset,
                  z: aspirateZOffset,
                },
              },
            }),
          ]
          // prewet before each aspirate if enabled
          const preWetTipCommands = args.preWetTip
            ? mixInPlaceUtil({
                pipette: args.pipette,
                volume: subTransferVol,
                times: 1,
                aspirateFlowRateUlSec,
                dispenseFlowRateUlSec,
                aspirateDelaySeconds: aspirateDelay?.seconds ?? 0,
                dispenseDelaySeconds: dispenseDelay?.seconds ?? 0,
                finalPushOut: 0, // according to transfer_components_executor, don't push out here
                invariantContext,
              })
            : []
          const mixBeforeAspirateCommands =
            args.mixBeforeAspirate != null
              ? mixInPlaceUtil({
                  pipette: args.pipette,
                  volume: args.mixBeforeAspirate.volume,
                  times: args.mixBeforeAspirate.times,
                  aspirateFlowRateUlSec,
                  dispenseFlowRateUlSec,
                  aspirateDelaySeconds: aspirateDelay?.seconds,
                  dispenseDelaySeconds: dispenseDelay?.seconds,
                  finalPushOut: 0, // according to transfer_components_executor, don't push out here
                  invariantContext,
                })
              : []
          const delayAfterAspirateCommands =
            aspirateDelay != null
              ? [
                  curryCommandCreator(delay, {
                    seconds: aspirateDelay.seconds,
                  }),
                ]
              : []
          const touchTipAfterRetractCommands = args.touchTipAfterAspirate
            ? [
                curryCommandCreator(touchTip, {
                  pipetteId: args.pipette,
                  labwareId: args.sourceLabware,
                  wellName: sourceWell,
                  ...(args.touchTipAfterAspirateMmFromEdge != null
                    ? { mmFromEdge: args.touchTipAfterAspirateMmFromEdge }
                    : {}),
                  zOffsetFromTop: args.touchTipAfterAspirateOffsetMmFromTop,
                  ...(args.touchTipAfterAspirateSpeed != null
                    ? { speed: args.touchTipAfterAspirateSpeed }
                    : {}),
                }),
                // move back to retract position after touch tip if air gap needed
                ...(aspirateAirGapVolume > 0
                  ? [
                      curryCommandCreator(moveToWell, {
                        pipetteId: args.pipette,
                        labwareId: args.sourceLabware,
                        wellName: sourceWell,
                        wellLocation: aspirateRetractLocation,
                      }),
                    ]
                  : []),
              ]
            : []
          const airGapAfterRetractCommands =
            aspirateAirGapVolume > 0
              ? [
                  curryCommandCreator(airGapInPlace, {
                    pipetteId: args.pipette,
                    volume: aspirateAirGapVolume,
                    flowRate: aspirateFlowRateUlSec,
                  }),
                  ...(aspirateDelay != null ? delayAfterAspirateCommands : []),
                ]
              : []
          //  can not touch tip in a waste chute
          const touchTipAfterDispenseCommands =
            args.touchTipAfterDispense && destinationWell != null
              ? [
                  curryCommandCreator(touchTip, {
                    pipetteId: args.pipette,
                    labwareId: args.destLabware,
                    wellName: destinationWell,
                    zOffsetFromTop: args.touchTipAfterDispenseOffsetMmFromTop,
                    ...(args.touchTipAfterDispenseSpeed != null
                      ? { speed: args.touchTipAfterDispenseSpeed }
                      : {}),
                  }),
                ]
              : []
          //  can not mix in a waste chute
          const mixInDestinationCommands =
            args.mixInDestination != null && destinationWell != null
              ? mixUtil({
                  pipette: args.pipette,
                  labware: args.destLabware,
                  well: destinationWell,
                  volume: args.mixInDestination.volume,
                  times: args.mixInDestination.times,
                  offsetFromBottomMm: dispenseOffsetFromBottomMm,
                  aspirateFlowRateUlSec,
                  dispenseFlowRateUlSec,
                  aspirateDelaySeconds: aspirateDelay?.seconds,
                  dispenseDelaySeconds: dispenseDelay?.seconds,
                  tipRack,
                  xOffset: dispenseXOffset,
                  yOffset: dispenseYOffset,
                  nozzles: args.nozzles,
                  invariantContext,
                  finalPushOut: pushOut,
                })
              : []

          const dispenseAspirateAirGapCommands =
            aspirateAirGapVolume && destinationWell != null
              ? [
                  curryCommandCreator(dispense, {
                    pipetteId: args.pipette,
                    volume: aspirateAirGapVolume,
                    labwareId: args.destLabware,
                    wellName: destinationWell,
                    flowRate: dispenseFlowRateUlSec,
                    wellLocation: {
                      origin: 'top',
                      offset: {
                        z: AIR_GAP_OFFSET_FROM_TOP,
                        x: 0,
                        y: 0,
                      },
                    },
                    isAirGap: true,
                    tipRack: args.tipRack,
                    nozzles: args.nozzles,
                  }),
                  ...(dispenseDelay != null
                    ? [
                        curryCommandCreator(delay, {
                          seconds: dispenseDelay.seconds,
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
            willReuseTip = nextDestWell === destinationWell
          }

          const aspirateCommands = [
            curryCommandCreator(aspirateInPlace, {
              pipetteId: args.pipette,
              volume: subTransferVol,
              flowRate: aspirateFlowRateUlSec,
            }),
            ...delayAfterAspirateCommands,
          ]
          const postAspirateRetractCommands = [
            curryCommandCreator(moveToWell, {
              pipetteId: args.pipette,
              labwareId: args.sourceLabware,
              ...(args.aspirateRetractSpeed != null
                ? { speed: args.aspirateRetractSpeed }
                : {}),
              wellName: sourceWell,
              wellLocation: aspirateRetractLocation,
            }),
            ...(aspirateRetractDelay != null &&
            aspirateRetractDelay?.seconds > 0
              ? [
                  curryCommandCreator(delay, {
                    seconds: aspirateRetractDelay.seconds,
                  }),
                ]
              : []),
          ]
          const dispenseCommand = [
            curryCommandCreator(dispenseLocationHelper, {
              pipetteId: args.pipette,
              volume: subTransferVol,
              destinationId: args.destLabware,
              well: destinationWell ?? undefined,
              flowRate: dispenseFlowRateUlSec,
              offsetFromBottomMm: dispenseOffsetFromBottomMm,
              xOffset: dispenseXOffset,
              yOffset: dispenseYOffset,
              tipRack: args.tipRack,
              nozzles: args.nozzles,
            }),
          ]

          const delayAfterDispenseCommands =
            dispenseDelay != null
              ? [
                  curryCommandCreator(delayLocationHelper, {
                    pipetteId: args.pipette,
                    destinationId: args.destLabware,
                    well: destinationWell,
                    zOffset: dispenseDelay.mmFromBottom,
                    seconds: dispenseDelay.seconds,
                  }),
                ]
              : []

          const blowoutCommand = blowoutLocationHelper({
            pipette: args.pipette,
            sourceLabwareId: args.sourceLabware,
            sourceWell: sourceWell,
            destLabwareId: args.destLabware,
            destWell: destinationWell,
            blowoutLocation: args.blowoutLocation,
            flowRate: blowoutFlowRateUlSec,
            offsetFromTopMm: blowoutOffsetFromTopMm,
            invariantContext,
          })

          const airGapAfterDispenseCommands =
            dispenseAirGapVolume && !willReuseTip
              ? [
                  curryCommandCreator(airGapLocationHelper, {
                    sourceWell,
                    blowOutLocation: args.blowoutLocation,
                    sourceId: args.sourceLabware,
                    pipetteId: args.pipette,
                    volume: dispenseAirGapVolume,
                    destinationId: args.destLabware,
                    destWell: destinationWell,
                    flowRate: aspirateFlowRateUlSec,
                    offsetFromTopMm: AIR_GAP_OFFSET_FROM_TOP,
                  }),
                  ...(aspirateDelay != null
                    ? [
                        curryCommandCreator(delay, {
                          seconds: aspirateDelay.seconds,
                        }),
                      ]
                    : []),
                ]
              : []

          let dropTipCommand = [
            curryCommandCreator(dropTip, {
              pipette: args.pipette,
              dropTipLocation: args.dropTipLocation,
            }),
          ]
          if (isWasteChute) {
            dropTipCommand = [
              curryCommandCreator(dropTipInWasteChute, {
                pipetteId: args.pipette,
                wasteChuteId:
                  invariantContext.wasteChuteEntities[args.dropTipLocation].id,
              }),
            ]
          }
          if (isTrashBin) {
            dropTipCommand = [
              curryCommandCreator(dropTipInTrash, {
                pipetteId: args.pipette,
                trashLocation: invariantContext.trashBinEntities[
                  args.dropTipLocation
                ].location as CutoutId,
              }),
            ]
          }

          // if using dispense > air gap, drop or change the tip at the end
          const dropTipAfterDispenseAirGap =
            airGapAfterDispenseCommands.length > 0 && isLastChunk && isLastPair
              ? dropTipCommand
              : []

          const nextCommands = [
            ...tipCommands,
            ...preAspirateSubmergeCommands,
            ...aspirateSubmergeCommands,
            ...mixBeforeAspirateCommands,
            ...preWetTipCommands,
            ...aspirateCommands,
            ...postAspirateRetractCommands,
            ...touchTipAfterRetractCommands,
            ...airGapAfterRetractCommands,
            ...dispenseAspirateAirGapCommands,
            ...dispenseCommand,
            ...delayAfterDispenseCommands,
            ...mixInDestinationCommands,
            ...blowoutCommand,
            ...touchTipAfterDispenseCommands,
            ...airGapAfterDispenseCommands,
            ...dropTipAfterDispenseAirGap,
          ]
          // NOTE: side-effecting
          prevSourceWell = sourceWell
          prevDestWell = destinationWell
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
