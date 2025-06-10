import assert from 'assert'
import zip from 'lodash/zip'

import {
  getCorrectionVolume,
  getMmFromBottom,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  LOW_VOLUME_PIPETTES,
  POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN,
  SAFE_MOVE_TO_WELL_LOCATION,
  WELL_ORIGIN_TOP,
} from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import { getPipetteWithTipMaxVol } from '../../robotStateSelectors'
import {
  curryCommandCreator,
  DEST_WELL_BLOWOUT_DESTINATION,
  getSlotInLocationStack,
  getTrashOrLabware,
  reduceCommandCreators,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '../../utils'
import {
  airGapInPlace,
  aspirateInPlace,
  blowOutInPlace,
  configureForVolume,
  delay,
  dispenseInPlace,
  moveToAddressableArea,
  moveToWell,
  prepareToAspirate,
  touchTip,
} from '../atomic'
import { blowOutInTrash } from './blowOutInTrash'
import { blowOutInWasteChute } from './blowOutInWasteChute'
import { mixInPlaceUtil } from './mix'
import { replaceTip } from './replaceTip'

import type { WellLocation } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  CurriedCommandCreator,
  TransferArgs,
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

  // TODO: BC 2019-07-08 these argument names are a bit misleading, instead of being values bound
  // to the action of aspiration of dispensing in a given command, they are actually values bound
  // to a given labware associated with a command (e.g. Source, Destination). For this reason we
  // currently remapping the inner mix values. Those calls to mixUtil should become easier to read
  // when we decide to rename these fields/args... probably all the way up to the UI level.
  const {
    aspirateAirGapVolume,
    aspirateDelay,
    aspirateFlowRateUlSec,
    aspiratePositionReference,
    aspirateRetractDelay,
    aspirateRetractPositionReference,
    aspirateRetractSpeed,
    aspirateRetractXOffset,
    aspirateRetractYOffset,
    aspirateRetractZOffset,
    aspirateSubmergeDelay,
    aspirateSubmergePositionReference,
    aspirateSubmergeSpeed,
    aspirateSubmergeXOffset,
    aspirateSubmergeYOffset,
    aspirateSubmergeZOffset,
    aspirateXOffset,
    aspirateYOffset,
    aspirateZOffset,
    blowoutFlowRateUlSec,
    blowoutLocation,
    changeTip,
    destLabware,
    destWells,
    dispenseAirGapVolume,
    dispenseDelay,
    dispenseFlowRateUlSec,
    dispensePositionReference,
    dispenseRetractDelay,
    dispenseRetractPositionReference,
    dispenseRetractSpeed,
    dispenseRetractXOffset,
    dispenseRetractYOffset,
    dispenseRetractZOffset,
    dispenseSubmergeDelay,
    dispenseSubmergePositionReference,
    dispenseSubmergeSpeed,
    dispenseSubmergeXOffset,
    dispenseSubmergeYOffset,
    dispenseSubmergeZOffset,
    dispenseXOffset,
    dispenseYOffset,
    dispenseZOffset,
    dropTipLocation,
    liquidClass,
    mixBeforeAspirate,
    mixInDestination,
    nozzles,
    pipette,
    preWetTip,
    pushOut,
    sourceLabware,
    sourceWells,
    tipRack,
    touchTipAfterAspirate,
    touchTipAfterAspirateMmFromEdge,
    touchTipAfterAspirateOffsetMmFromTop,
    touchTipAfterAspirateSpeed,
    touchTipAfterDispense,
    touchTipAfterDispenseMmFromEdge,
    touchTipAfterDispenseOffsetMmFromTop,
    touchTipAfterDispenseSpeed,
    volume,
  } = args

  const trashOrLabware = getTrashOrLabware(
    invariantContext.labwareEntities,
    invariantContext.wasteChuteEntities,
    invariantContext.trashBinEntities,
    destLabware
  )

  if (
    (trashOrLabware === 'labware' &&
      destWells != null &&
      sourceWells.length === destWells.length) ||
    ((trashOrLabware === 'wasteChute' || trashOrLabware === 'trashBin') &&
      destWells == null &&
      sourceWells.length >= 1)
  ) {
    // No assertion failure, continue with the logic
  } else {
    assert(
      false,
      `Transfer command creator expected N:N source-to-dest wells ratio. Got ${sourceWells.length}:${destWells?.length} in labware`
    )
  }

  // TODO Ian 2018-04-02 following ~10 lines are identical to first lines of consolidate.js...
  const actionName = 'transfer'
  const errors: CommandCreatorError[] = []

  if (
    !prevRobotState.pipettes[pipette] ||
    !invariantContext.pipetteEntities[pipette]
  ) {
    // bail out before doing anything else
    errors.push(
      errorCreators.pipetteDoesNotExist({
        pipette,
      })
    )
  }
  if (!sourceLabware || !prevRobotState.labware[sourceLabware]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware: sourceLabware,
      })
    )
  }

  const initialDestLabwareSlot =
    prevRobotState.labware[destLabware] != null
      ? getSlotInLocationStack(prevRobotState.labware[destLabware].stack)
      : ''

  const initialSourceLabwareSlot = getSlotInLocationStack(
    prevRobotState.labware[sourceLabware]?.stack
  )
  const hasWasteChute =
    Object.keys(invariantContext.wasteChuteEntities).length > 0

  const isWasteChute =
    invariantContext.wasteChuteEntities[dropTipLocation] != null
  const isTrashBin = invariantContext.trashBinEntities[dropTipLocation] != null

  if (
    hasWasteChute &&
    (initialDestLabwareSlot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA ||
      initialSourceLabwareSlot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA)
  ) {
    errors.push(errorCreators.labwareDiscarded())
  }

  if (
    !destLabware ||
    (!invariantContext.labwareEntities[destLabware] &&
      !invariantContext.wasteChuteEntities[destLabware] &&
      !invariantContext.trashBinEntities[destLabware])
  ) {
    errors.push(errorCreators.equipmentDoesNotExist())
  }

  if (!dropTipLocation || (!isWasteChute && !isTrashBin)) {
    errors.push(errorCreators.dropTipLocationDoesNotExist())
  }

  if (errors.length > 0)
    return {
      errors,
    }

  const aspirateAirGapVol = aspirateAirGapVolume || 0
  const dispenseAirGapVol = dispenseAirGapVolume || 0
  const effectiveTransferVol =
    getPipetteWithTipMaxVol(pipette, invariantContext, tipRack) -
    aspirateAirGapVol

  const chunksPerSubTransfer = Math.ceil(volume / effectiveTransferVol)
  const subTransferVol = volume / chunksPerSubTransfer
  // volume of each chunk in a sub-transfer
  const subTransferVolumes: number[] = Array(chunksPerSubTransfer).fill(
    subTransferVol
  )

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
  const dispenseSubmergeLocation: WellLocation = {
    origin:
      POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN[
        dispenseSubmergePositionReference
      ],
    offset: {
      x: dispenseSubmergeXOffset,
      y: dispenseSubmergeYOffset,
      z: dispenseSubmergeZOffset,
    },
  }
  const dispenseRetractLocation: WellLocation = {
    origin:
      POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN[
        dispenseRetractPositionReference
      ],
    offset: {
      x: dispenseRetractXOffset,
      y: dispenseRetractYOffset,
      z: dispenseRetractZOffset,
    },
  }
  const pipetteSpecs = invariantContext.pipetteEntities[pipette].spec

  // @ts-expect-error(SA, 2021-05-05): zip can return undefined so this really should be Array<[string | undefined, string | undefined]>
  const sourceDestPairs: Array<[string, string | null]> = zip(
    sourceWells,
    destWells
  )
  let prevSourceWell: string | null = null
  let prevDestWell: string | null = null
  // const probedWells: Set<string> = new Set()
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
          const isUltimateSubtransfer = isLastChunk && isLastPair
          let changeTipNow = false // 'never' by default

          if (changeTip === 'always') {
            changeTipNow = true
          } else if (changeTip === 'once') {
            changeTipNow = isInitialSubtransfer
          } else if (changeTip === 'perSource') {
            changeTipNow = sourceWell !== prevSourceWell
          } else if (changeTip === 'perDest') {
            changeTipNow =
              isInitialSubtransfer || destinationWell !== prevDestWell
          }

          const configureForVolumeCommand = LOW_VOLUME_PIPETTES.includes(
            invariantContext.pipetteEntities[pipette].name
          )
            ? [
                curryCommandCreator(configureForVolume, {
                  pipetteId: pipette,
                  volume: subTransferVol,
                }),
              ]
            : []

          const tipCommands = changeTipNow
            ? [
                curryCommandCreator(replaceTip, {
                  pipette,
                  dropTipLocation,
                  tipRack,
                  ...(nozzles != null ? { nozzles } : {}),
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
            aspirateMmFromBottom > aspirateSubmergeMmFromBottom
          ) {
            errors.push(errorCreators.submergeBelowAspirate())
          }
          if (
            aspirateMmFromBottom != null &&
            aspirateRetractMmFromBottom != null &&
            aspirateMmFromBottom > aspirateRetractMmFromBottom
          ) {
            errors.push(errorCreators.retractBelowAspirate())
          }

          const moveToSourceWellTopCommand = [
            curryCommandCreator(moveToWell, {
              pipetteId: pipette,
              labwareId: sourceLabware,
              wellName: sourceWell,
              wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
            }),
          ]
          // TODO (nd, 05/13/2025): uncomment and refine below logic once meniscus-relative pipetting is supported in PD
          // let liquidProbeCommand: CurriedCommandCreator[] = []
          // if (changeTipNow && !probedWells.has(sourceWell)) {
          //   liquidProbeCommand = [
          //     curryCommandCreator(liquidProbe, {
          //       pipetteId: pipette,
          //       labwareId: sourceLabware,
          //       wellName: sourceWell,
          //       wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
          //     }),
          //   ]
          //   probedWells.add(sourceWell)
          // }
          const prepareToAspirateCommand = [
            curryCommandCreator(prepareToAspirate, {
              pipetteId: pipette,
            }),
          ]
          const dispenseCorrectionVolumeForDispenseAirGap = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: dispenseAirGapVol,
              liquidHandlingAction: 'singleDispense',
            }
          )
          const voidDispenseAirGapCommand =
            dispenseAirGapVol > 0 &&
            !changeTipNow &&
            (chunkIdx > 0 || pairIdx > 0)
              ? [
                  curryCommandCreator(dispenseInPlace, {
                    pipetteId: pipette,
                    volume: dispenseAirGapVol,
                    flowRate: dispenseFlowRateUlSec,
                    ...(dispenseCorrectionVolumeForDispenseAirGap > 0
                      ? {
                          correctionVolume: dispenseCorrectionVolumeForDispenseAirGap,
                        }
                      : {}),
                  }),
                ]
              : []
          const preAspirateSubmergeCommands = [
            ...moveToSourceWellTopCommand,
            ...voidDispenseAirGapCommand,
            // ...liquidProbeCommand,
            ...configureForVolumeCommand,
            ...prepareToAspirateCommand,
          ]
          const aspirateSubmergeCommands = [
            curryCommandCreator(moveToWell, {
              pipetteId: pipette,
              labwareId: sourceLabware,
              wellName: sourceWell,
              wellLocation: aspirateSubmergeLocation,
            }),
            curryCommandCreator(moveToWell, {
              pipetteId: pipette,
              labwareId: sourceLabware,
              ...(aspirateSubmergeSpeed != null
                ? { speed: aspirateSubmergeSpeed }
                : {}),
              wellName: sourceWell,
              wellLocation: {
                origin:
                  POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN[
                    aspiratePositionReference
                  ],
                offset: {
                  x: aspirateXOffset,
                  y: aspirateYOffset,
                  z: aspirateZOffset,
                },
              },
            }),
            ...(aspirateSubmergeDelay != null &&
            aspirateSubmergeDelay.seconds > 0
              ? [
                  curryCommandCreator(delay, {
                    seconds: aspirateSubmergeDelay.seconds,
                  }),
                ]
              : []),
          ]
          // prewet before each aspirate if enabled
          const preWetTipCommands = preWetTip
            ? mixInPlaceUtil({
                pipette,
                volume: subTransferVol,
                times: 1,
                aspirateFlowRateUlSec,
                dispenseFlowRateUlSec,
                aspirateDelaySeconds: aspirateDelay?.seconds ?? 0,
                dispenseDelaySeconds: dispenseDelay?.seconds ?? 0,
                finalPushOut: 0, // according to transfer_components_executor, don't push out here
                invariantContext,
                liquidClass,
                tiprack: tipRack,
              })
            : []
          const mixBeforeAspirateCommands =
            mixBeforeAspirate != null
              ? mixInPlaceUtil({
                  pipette,
                  volume: mixBeforeAspirate.volume,
                  times: mixBeforeAspirate.times,
                  aspirateFlowRateUlSec,
                  dispenseFlowRateUlSec,
                  aspirateDelaySeconds: aspirateDelay?.seconds,
                  dispenseDelaySeconds: dispenseDelay?.seconds,
                  finalPushOut: 0, // according to transfer_components_executor, don't push out here
                  invariantContext,
                  liquidClass,
                  tiprack: tipRack,
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
          const touchTipAfterAspirateRetractCommands = touchTipAfterAspirate
            ? [
                curryCommandCreator(touchTip, {
                  pipetteId: pipette,
                  labwareId: sourceLabware,
                  wellName: sourceWell,
                  ...(touchTipAfterAspirateMmFromEdge != null
                    ? { mmFromEdge: touchTipAfterAspirateMmFromEdge }
                    : {}),
                  zOffsetFromTop: touchTipAfterAspirateOffsetMmFromTop,
                  ...(touchTipAfterAspirateSpeed != null
                    ? { speed: touchTipAfterAspirateSpeed }
                    : {}),
                }),
                // move back to retract position after touch tip if air gap needed
                ...(aspirateAirGapVol > 0
                  ? [
                      curryCommandCreator(moveToWell, {
                        pipetteId: pipette,
                        labwareId: sourceLabware,
                        wellName: sourceWell,
                        wellLocation: aspirateRetractLocation,
                      }),
                    ]
                  : []),
              ]
            : []
          const aspirateCorrectionVolumeForAspirateAirGap = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: aspirateAirGapVol,
              liquidHandlingAction: 'aspirate',
            }
          )
          const airGapAfterAspirateRetractCommands =
            aspirateAirGapVol > 0
              ? [
                  curryCommandCreator(airGapInPlace, {
                    pipetteId: pipette,
                    volume: aspirateAirGapVol,
                    flowRate: aspirateFlowRateUlSec,
                    ...(aspirateCorrectionVolumeForAspirateAirGap > 0
                      ? {
                          correctionVolume: aspirateCorrectionVolumeForAspirateAirGap,
                        }
                      : {}),
                  }),
                  ...delayAfterAspirateCommands,
                ]
              : []

          const aspirateCorrectionVolumeForSubtransferTarget = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: subTransferVol,
              liquidHandlingAction: 'aspirate',
            }
          )
          const aspirateCommands = [
            curryCommandCreator(aspirateInPlace, {
              pipetteId: pipette,
              volume: subTransferVol,
              flowRate: aspirateFlowRateUlSec,
              ...(aspirateCorrectionVolumeForSubtransferTarget > 0
                ? {
                    correctionVolume: aspirateCorrectionVolumeForSubtransferTarget,
                  }
                : {}),
            }),
            ...delayAfterAspirateCommands,
          ]
          const postAspirateRetractCommands = [
            curryCommandCreator(moveToWell, {
              pipetteId: pipette,
              labwareId: sourceLabware,
              ...(aspirateRetractSpeed != null
                ? { speed: aspirateRetractSpeed }
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
          const delayAfterDispenseCommands =
            dispenseDelay != null
              ? [
                  curryCommandCreator(delay, {
                    seconds: dispenseDelay.seconds,
                  }),
                ]
              : []
          const dispenseCorrectionVolumeForAspirateAirGap = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: aspirateAirGapVol,
              liquidHandlingAction: 'singleDispense',
            }
          )
          const dispenseSubmergeCommands =
            destinationWell != null
              ? [
                  curryCommandCreator(moveToWell, {
                    pipetteId: pipette,
                    labwareId: destLabware,
                    wellName: destinationWell,
                    wellLocation: dispenseSubmergeLocation,
                  }),
                  ...(aspirateAirGapVol > 0
                    ? [
                        curryCommandCreator(dispenseInPlace, {
                          pipetteId: pipette,
                          volume: aspirateAirGapVol,
                          flowRate: dispenseFlowRateUlSec,
                          pushOut: 0,
                          ...(dispenseCorrectionVolumeForAspirateAirGap > 0
                            ? {
                                correctionVolume: dispenseCorrectionVolumeForAspirateAirGap,
                              }
                            : {}),
                        }),
                        ...delayAfterDispenseCommands,
                      ]
                    : []),
                  curryCommandCreator(moveToWell, {
                    pipetteId: pipette,
                    labwareId: destLabware,
                    ...(dispenseSubmergeSpeed != null
                      ? { speed: dispenseSubmergeSpeed }
                      : {}),
                    wellName: destinationWell,
                    wellLocation: {
                      origin:
                        POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN[
                          dispensePositionReference
                        ],
                      offset: {
                        x: dispenseXOffset,
                        y: dispenseYOffset,
                        z: dispenseZOffset,
                      },
                    },
                  }),
                  ...(dispenseSubmergeDelay != null &&
                  dispenseSubmergeDelay.seconds > 0
                    ? [
                        curryCommandCreator(delay, {
                          seconds: dispenseSubmergeDelay.seconds,
                        }),
                      ]
                    : []),
                ]
              : [
                  curryCommandCreator(moveToAddressableArea, {
                    fixtureId: destLabware,
                    pipetteId: pipette,
                    offset: {
                      x: 0,
                      y: 0,
                      z: 0,
                    },
                  }),
                ]

          // don't push out if mixing in destination
          const effectivePushOut =
            mixInDestination != null && destinationWell != null ? 0 : pushOut
          const dispenseCorrectionVolumeForSubtransferTarget = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: subTransferVol,
              liquidHandlingAction: 'singleDispense',
            }
          )
          const dispenseCommands = [
            curryCommandCreator(dispenseInPlace, {
              pipetteId: pipette,
              volume: subTransferVol,
              flowRate: dispenseFlowRateUlSec,
              ...(effectivePushOut != null
                ? { pushOut: effectivePushOut }
                : {}),
              ...(dispenseCorrectionVolumeForSubtransferTarget > 0
                ? {
                    correctionVolume: dispenseCorrectionVolumeForSubtransferTarget,
                  }
                : {}),
            }),
            ...delayAfterDispenseCommands,
          ]

          const mixAfterDispenseCommands =
            mixInDestination != null && destinationWell != null
              ? mixInPlaceUtil({
                  pipette,
                  volume: mixInDestination.volume,
                  times: mixInDestination.times,
                  aspirateFlowRateUlSec,
                  dispenseFlowRateUlSec,
                  aspirateDelaySeconds: aspirateDelay?.seconds,
                  dispenseDelaySeconds: dispenseDelay?.seconds,
                  finalPushOut: pushOut,
                  invariantContext,
                  liquidClass,
                  tiprack: tipRack,
                })
              : []

          const postDispenseRetractCommands =
            destinationWell != null
              ? [
                  curryCommandCreator(moveToWell, {
                    pipetteId: pipette,
                    labwareId: destLabware,
                    ...(dispenseRetractSpeed != null
                      ? { speed: dispenseRetractSpeed }
                      : {}),
                    wellName: destinationWell,
                    wellLocation: dispenseRetractLocation,
                  }),
                  ...(dispenseRetractDelay != null &&
                  dispenseRetractDelay?.seconds > 0
                    ? [
                        curryCommandCreator(delay, {
                          seconds: dispenseRetractDelay.seconds,
                        }),
                      ]
                    : []),
                ]
              : []

          const blowoutInPlaceCommand = curryCommandCreator(blowOutInPlace, {
            pipetteId: pipette,
            flowRate: blowoutFlowRateUlSec,
          })
          const aspirateCorrectionVolumeForDispenseAirGap = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: dispenseAirGapVol,
              liquidHandlingAction: 'aspirate',
            }
          )

          const getAirGapAfterDispenseCommands = (
            considerUltimateSubtransfer: boolean
          ): CurriedCommandCreator[] =>
            dispenseAirGapVol > 0 &&
            !(
              changeTip === 'never' &&
              isUltimateSubtransfer &&
              considerUltimateSubtransfer
            ) // don't air gap if end of full transfer and not changing tip
              ? [
                  curryCommandCreator(airGapInPlace, {
                    pipetteId: pipette,
                    volume: dispenseAirGapVol,
                    flowRate: aspirateFlowRateUlSec,
                    ...(aspirateCorrectionVolumeForDispenseAirGap > 0
                      ? {
                          correctionVolume: aspirateCorrectionVolumeForDispenseAirGap,
                        }
                      : {}),
                  }),
                  ...delayAfterAspirateCommands,
                ]
              : []

          const getTouchTipAfterDispenseRetractCommands = (
            considerUltimateSubtransfer: boolean
          ): CurriedCommandCreator[] =>
            destinationWell != null && touchTipAfterDispense
              ? [
                  curryCommandCreator(touchTip, {
                    pipetteId: pipette,
                    labwareId: destLabware,
                    wellName: destinationWell,
                    ...(touchTipAfterDispenseMmFromEdge != null
                      ? { mmFromEdge: touchTipAfterDispenseMmFromEdge }
                      : {}),
                    zOffsetFromTop: touchTipAfterDispenseOffsetMmFromTop,
                    ...(touchTipAfterDispenseSpeed != null
                      ? { speed: touchTipAfterDispenseSpeed }
                      : {}),
                  }),
                  // move back to retract position after touch tip if air gap needed
                  ...(getAirGapAfterDispenseCommands(
                    considerUltimateSubtransfer
                  ).length > 0
                    ? [
                        curryCommandCreator(moveToWell, {
                          pipetteId: pipette,
                          labwareId: destLabware,
                          wellName: destinationWell,
                          wellLocation: dispenseRetractLocation,
                        }),
                      ]
                    : []),
                ]
              : []
          let advancedDispenseArgsCommands: CurriedCommandCreator[] = []
          switch (blowoutLocation) {
            case null:
            case undefined:
              advancedDispenseArgsCommands = [
                ...getTouchTipAfterDispenseRetractCommands(true),
                ...getAirGapAfterDispenseCommands(true),
              ]
              break
            case DEST_WELL_BLOWOUT_DESTINATION:
              advancedDispenseArgsCommands = [
                blowoutInPlaceCommand,
                ...getTouchTipAfterDispenseRetractCommands(true),
                ...getAirGapAfterDispenseCommands(true),
              ]
              break
            case SOURCE_WELL_BLOWOUT_DESTINATION:
              advancedDispenseArgsCommands = [
                ...getTouchTipAfterDispenseRetractCommands(true),
                ...getAirGapAfterDispenseCommands(false),
                curryCommandCreator(moveToWell, {
                  pipetteId: pipette,
                  labwareId: sourceLabware,
                  wellName: sourceWell,
                  wellLocation: {
                    origin: WELL_ORIGIN_TOP,
                  },
                }),
                blowoutInPlaceCommand,
                // touch tip at source well with dispense touch tip parameters
                ...(touchTipAfterDispense
                  ? [
                      curryCommandCreator(touchTip, {
                        pipetteId: pipette,
                        labwareId: sourceLabware,
                        wellName: sourceWell,
                        ...(touchTipAfterDispenseMmFromEdge != null
                          ? { mmFromEdge: touchTipAfterDispenseMmFromEdge }
                          : {}),
                        zOffsetFromTop: touchTipAfterDispenseOffsetMmFromTop,
                        ...(touchTipAfterDispenseSpeed != null
                          ? { speed: touchTipAfterDispenseSpeed }
                          : {}),
                      }),
                    ]
                  : []),
                ...(getAirGapAfterDispenseCommands(true).length > 0
                  ? [
                      curryCommandCreator(moveToWell, {
                        pipetteId: pipette,
                        labwareId: sourceLabware,
                        wellName: sourceWell,
                        wellLocation: { origin: WELL_ORIGIN_TOP },
                      }),
                    ]
                  : []),
                ...getAirGapAfterDispenseCommands(true),
              ]
              break
            default:
              // trash or waste chute
              if (blowoutLocation in invariantContext.trashBinEntities) {
                advancedDispenseArgsCommands = [
                  ...getTouchTipAfterDispenseRetractCommands(false),
                  ...getAirGapAfterDispenseCommands(false),
                  curryCommandCreator(blowOutInTrash, {
                    pipetteId: pipette,
                    flowRate: blowoutFlowRateUlSec,
                    trashId: blowoutLocation,
                  }),
                  ...getAirGapAfterDispenseCommands(true),
                ]
              } else if (
                blowoutLocation in invariantContext.wasteChuteEntities
              ) {
                advancedDispenseArgsCommands = [
                  curryCommandCreator(blowOutInWasteChute, {
                    pipetteId: pipette,
                    flowRate: blowoutFlowRateUlSec,
                    wasteChuteId: blowoutLocation,
                  }),
                  ...getAirGapAfterDispenseCommands(true),
                ]
              }
              break
          }

          // if using dispense > air gap, drop or change the tip at the end
          const nextCommands = [
            ...tipCommands,
            ...preAspirateSubmergeCommands,
            ...aspirateSubmergeCommands,
            ...mixBeforeAspirateCommands,
            ...preWetTipCommands,
            ...aspirateCommands,
            ...postAspirateRetractCommands,
            ...touchTipAfterAspirateRetractCommands,
            ...airGapAfterAspirateRetractCommands,
            ...dispenseSubmergeCommands,
            ...dispenseCommands,
            ...mixAfterDispenseCommands,
            ...postDispenseRetractCommands,
            ...advancedDispenseArgsCommands,
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
