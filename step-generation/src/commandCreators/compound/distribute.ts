import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'

import {
  ALL,
  getAllLiquidClassDefs,
  getCorrectionVolume,
  getFlexNameConversion,
  getMmFromBottom,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  LOW_VOLUME_PIPETTES,
  NONE_LIQUID_CLASS_NAME,
  POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN,
  SAFE_MOVE_TO_WELL_LOCATION,
  WATER_LIQUID_CLASS_NAME,
  WELL_ORIGIN_TOP,
} from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import { getPipetteWithTipMaxVol } from '../../robotStateSelectors'
import {
  curryCommandCreator,
  DEST_WELL_BLOWOUT_DESTINATION,
  getIsSafePipetteMovement,
  getSlotInLocationStack,
  getTransferPlanAndReferenceVolumes,
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
import { mixInPlaceUtil } from './mix'
import { replaceTip } from './replaceTip'

import type { WellLocation } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  CurriedCommandCreator,
  DistributeArgs,
} from '../../types'

export const distribute: CommandCreator<DistributeArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /**
    Distribute will aspirate from a single source well into multiple destination wells.
     If the volume to aspirate from the source well exceeds the max volume of the pipette,
    then distribute will be broken up into multiple asp-disp-disp, asp-disp-disp cycles.
     A single uniform volume will be aspirated to every destination well.
     =====
     For distribute, changeTip means:
    * 'always': before the first aspirate in a single asp-disp-disp cycle, get a fresh tip
    * 'once': get a new tip at the beginning of the distribute step, and use it throughout
    * 'never': reuse the tip from the last step
  */

  // TODO: BC 2019-07-08 these argument names are a bit misleading, instead of being values bound
  // to the action of aspiration of dispensing in a given command, they are actually values bound
  // to a given labware associated with a command (e.g. Source, Destination). For this reason we
  // currently remapping the inner mix values. Those calls to mixUtil should become easier to read
  // when we decide to rename these fields/.. probably all the way up to the UI level.
  const {
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
    conditioningVolume,
    destLabware,
    destWells,
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
    nozzles,
    pipette,
    preWetTip,
    pushOut,
    sourceLabware,
    sourceWell,
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

  // TODO Ian 2018-05-03 next ~20 lines match consolidate.js
  const actionName = 'distribute'
  const errors: CommandCreatorError[] = []
  const isMultiChannelPipette =
    invariantContext.pipetteEntities[pipette]?.spec.channels !== 1

  const aspirateAirGapVolume = args.aspirateAirGapVolume ?? 0
  const dispenseAirGapVolume = args.dispenseAirGapVolume ?? 0
  const disposalVolume =
    args.disposalVolume != null && args.disposalVolume > 0
      ? args.disposalVolume
      : 0
  // TODO: Ian 2019-04-19 revisit these pipetteDoesNotExist errors, how to do it DRY?
  if (
    prevRobotState.pipettes[pipette] == null ||
    invariantContext.pipetteEntities[pipette] == null
  ) {
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
  const initialDestLabwareSlot = getSlotInLocationStack(
    prevRobotState.labware[destLabware]?.stack
  )
  const initialSourceLabwareSlot = getSlotInLocationStack(
    prevRobotState.labware[sourceLabware]?.stack
  )
  const hasWasteChute =
    Object.keys(invariantContext.wasteChuteEntities).length > 0

  if (
    hasWasteChute &&
    (initialDestLabwareSlot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA ||
      initialSourceLabwareSlot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA)
  ) {
    errors.push(errorCreators.labwareDiscarded())
  }

  const isWasteChute =
    invariantContext.wasteChuteEntities[dropTipLocation] != null
  const isTrashBin = invariantContext.trashBinEntities[dropTipLocation] != null

  if (!dropTipLocation || (!isWasteChute && !isTrashBin)) {
    errors.push(errorCreators.dropTipLocationDoesNotExist())
  }

  const tiprack = Object.values(invariantContext.labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === tipRack
  )
  if (tiprack == null) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware: tipRack,
      })
    )
  }
  const { def: tiprackDefinition = null, labwareDefURI: tiprackDefUri } =
    tiprack ?? {}
  const {
    spec: pipetteSpecs,
    name: pipetteName,
  } = invariantContext.pipetteEntities[pipette]
  const liquidClassValuesForTip = getAllLiquidClassDefs()
    [
      liquidClass === NONE_LIQUID_CLASS_NAME || liquidClass == null
        ? WATER_LIQUID_CLASS_NAME
        : liquidClass
    ].byPipette?.find(
      ({ pipetteModel }) => (pipetteModel = getFlexNameConversion(pipetteSpecs))
    )
    ?.byTipType.find(({ tiprack }) => tiprack === tiprackDefUri)
  const { aspirate, multiDispense } = liquidClassValuesForTip ?? {}
  const { multiWellHandling } = getTransferPlanAndReferenceVolumes({
    pipetteSpecs,
    tiprackDefinition,
    volume,
    path: 'multiDispense',
    numDispenseWells: destWells.length,
    conditioningByVolume: (multiDispense?.conditioningByVolume ?? []) as Array<
      [number, number]
    >,
    disposalByVolume: (multiDispense?.disposalByVolume ?? []) as Array<
      [number, number]
    >,
    aspirateAirGapByVolume:
      (aspirate?.retract.airGapByVolume as Array<[number, number]>) ?? [],
  })
  const { numWellsToFitInTip } = multiWellHandling

  if (
    // these conditions should never be true— they are checked in moveLiquidFormToArgs
    !multiWellHandling.isSupported ||
    numWellsToFitInTip == null ||
    numWellsToFitInTip === 1
  ) {
    errors.push(errorCreators.multiDispenseValuesNotFound())
  }

  if (isMultiChannelPipette && nozzles !== ALL) {
    const isAspirateSafePipetteMovement = getIsSafePipetteMovement({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: sourceLabware,
      wellLocationOffset: { x: aspirateXOffset, y: aspirateYOffset },
      wellTargetName: sourceWell,
    })
    const isDispenseSafePipetteMovement = getIsSafePipetteMovement({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: destLabware,
      wellLocationOffset: { x: dispenseXOffset, y: dispenseYOffset },
      wellTargetName: destWells[0],
    })
    if (!isAspirateSafePipetteMovement && !isDispenseSafePipetteMovement) {
      errors.push(errorCreators.possiblePipetteCollision())
    }
  }

  const wellDepth =
    invariantContext.labwareEntities[sourceLabware]?.def.wells[sourceWell]
      ?.depth ?? null
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

  const maxVolume =
    getPipetteWithTipMaxVol(pipette, invariantContext, tipRack) -
    aspirateAirGapVolume
  const maxWellsPerChunk = Math.floor((maxVolume - disposalVolume) / volume)

  if (maxWellsPerChunk === 0) {
    // distribute vol exceeds pipette vol
    errors.push(
      errorCreators.pipetteVolumeExceeded({
        actionName,
        volume,
        maxVolume,
        disposalVolume,
      })
    )
  }
  if (errors.length > 0)
    return {
      errors,
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
  const destWellChunks = chunk(destWells, numWellsToFitInTip)
  const commandCreators = flatMap(
    destWellChunks,
    (destWellChunk: string[], chunkIndex: number): CurriedCommandCreator[] => {
      const numDestsPerAsp = destWellChunk.length // can differ on final chunk
      const totalSampleAspirateVolume = volume * numDestsPerAsp
      const isFirstChunk = chunkIndex === 0
      const isLastChunk = chunkIndex === destWellChunks.length - 1
      const changeTipNow =
        // path is in ['always', 'once', 'never']
        changeTip === 'always' || (changeTip === 'once' && isFirstChunk)

      const configureForVolumeCommand = LOW_VOLUME_PIPETTES.includes(
        pipetteName
      )
        ? [
            curryCommandCreator(configureForVolume, {
              pipetteId: pipette,
              volume: totalSampleAspirateVolume,
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
      // TODO (nd, 05/20/2025): uncomment and refine below logic once meniscus-relative pipetting is supported in PD
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
      const dispenseCorrectionVolumeForDispenseAirGap = getCorrectionVolume({
        liquidClass,
        pipetteSpecs,
        tiprackDefUri: tipRack,
        targetVolume: dispenseAirGapVolume,
        liquidHandlingAction: 'multiDispense',
      })
      const voidDispenseAirGapCommand =
        dispenseAirGapVolume > 0 &&
        !changeTipNow &&
        !isFirstChunk &&
        disposalVolume === 0 &&
        blowoutLocation == null
          ? [
              curryCommandCreator(dispenseInPlace, {
                isAirGap: true,
                pipetteId: pipette,
                volume: dispenseAirGapVolume,
                flowRate: dispenseFlowRateUlSec,
                ...(dispenseCorrectionVolumeForDispenseAirGap > 0
                  ? {
                      correctionVolume: dispenseCorrectionVolumeForDispenseAirGap,
                    }
                  : {}),
                pushOut: 0,
              }),
            ]
          : []

      const preAspirateSubmergeCommands = [
        ...moveToSourceWellTopCommand,
        ...voidDispenseAirGapCommand,
        // ...liquidProbeCommand, // for menisucs-relative pipetting
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
        ...(aspirateSubmergeDelay != null && aspirateSubmergeDelay.seconds > 0
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
            volume: totalSampleAspirateVolume,
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
      const delayAfterDispenseCommands =
        dispenseDelay != null
          ? [
              curryCommandCreator(delay, {
                seconds: dispenseDelay.seconds,
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
            ...(aspirateAirGapVolume > 0
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
      const aspirateCorrectionVolumeForAspirateAirGap = getCorrectionVolume({
        liquidClass,
        pipetteSpecs,
        tiprackDefUri: tipRack,
        targetVolume: aspirateAirGapVolume,
        liquidHandlingAction: 'aspirate',
      })
      const airGapAfterAspirateRetractCommands =
        aspirateAirGapVolume > 0
          ? [
              curryCommandCreator(airGapInPlace, {
                pipetteId: pipette,
                volume: aspirateAirGapVolume,
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
      const aspirateCorrectionVolumeForTotalAspiration = getCorrectionVolume({
        liquidClass,
        pipetteSpecs,
        tiprackDefUri: tipRack,
        targetVolume:
          totalSampleAspirateVolume +
          (disposalVolume ?? 0) +
          (conditioningVolume ?? 0),
        liquidHandlingAction: 'aspirate',
      })
      const dispenseCorrectionVolumeForConditioningVolume = getCorrectionVolume(
        {
          liquidClass,
          pipetteSpecs,
          tiprackDefUri: tipRack,
          targetVolume: conditioningVolume ?? 0,
          liquidHandlingAction: 'multiDispense',
        }
      )
      const dispenseConditioningVolumeCommands =
        conditioningVolume != null && conditioningVolume > 0
          ? [
              curryCommandCreator(dispenseInPlace, {
                pipetteId: pipette,
                volume: conditioningVolume,
                flowRate: dispenseFlowRateUlSec,
                correctionVolume: dispenseCorrectionVolumeForConditioningVolume,
              }),
              ...delayAfterDispenseCommands,
            ]
          : []
      const aspirateCommands = [
        curryCommandCreator(aspirateInPlace, {
          pipetteId: pipette,
          volume:
            totalSampleAspirateVolume +
            (disposalVolume ?? 0) +
            (conditioningVolume ?? 0),
          flowRate: aspirateFlowRateUlSec,
          correctionVolume: aspirateCorrectionVolumeForTotalAspiration,
        }),
        ...delayAfterAspirateCommands,
        ...dispenseConditioningVolumeCommands,
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
        ...(aspirateRetractDelay != null && aspirateRetractDelay?.seconds > 0
          ? [
              curryCommandCreator(delay, {
                seconds: aspirateRetractDelay.seconds,
              }),
            ]
          : []),
      ]
      const dispenseChunkCommands = flatMap(
        destWellChunk,
        (
          destinationWell: string,
          wellIndex: number
        ): CurriedCommandCreator[] => {
          const isFirstWellInChunk = wellIndex === 0
          const isLastWellInChunk = wellIndex === destWellChunk.length - 1
          const isOverallUltimateDispense = isLastChunk && isLastWellInChunk

          let airGapInTip = 0
          if (isFirstWellInChunk && aspirateAirGapVolume > 0) {
            airGapInTip = aspirateAirGapVolume
          } else if (
            !isFirstWellInChunk &&
            dispenseAirGapVolume > 0 &&
            (conditioningVolume == null || conditioningVolume === 0)
          ) {
            airGapInTip = dispenseAirGapVolume
          }
          const dispenseCorrectionVolumeForAirGap = getCorrectionVolume({
            liquidClass,
            pipetteSpecs,
            tiprackDefUri: tipRack,
            targetVolume: airGapInTip,
            liquidHandlingAction: 'multiDispense',
          })
          const dispenseSubmergeCommands =
            destinationWell != null
              ? [
                  curryCommandCreator(moveToWell, {
                    pipetteId: pipette,
                    labwareId: destLabware,
                    wellName: destinationWell,
                    wellLocation: dispenseSubmergeLocation,
                  }),
                  ...(airGapInTip > 0
                    ? [
                        curryCommandCreator(dispenseInPlace, {
                          isAirGap: true,
                          pipetteId: pipette,
                          volume: airGapInTip,
                          flowRate: dispenseFlowRateUlSec,
                          pushOut: 0,
                          correctionVolume: dispenseCorrectionVolumeForAirGap,
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
            disposalVolume === 0 && isLastWellInChunk ? pushOut : 0
          const dispenseCorrectionVolumeForDestination = getCorrectionVolume({
            liquidClass,
            pipetteSpecs,
            tiprackDefUri: tipRack,
            targetVolume: volume,
            liquidHandlingAction: 'multiDispense',
          })
          const dispenseCommands = [
            curryCommandCreator(dispenseInPlace, {
              pipetteId: pipette,
              volume,
              flowRate: dispenseFlowRateUlSec,
              ...(effectivePushOut != null
                ? { pushOut: effectivePushOut }
                : {}),
              correctionVolume: dispenseCorrectionVolumeForDestination,
            }),
            ...delayAfterDispenseCommands,
          ]
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
          const blowoutInPlaceCommand = isLastWellInChunk
            ? [
                curryCommandCreator(blowOutInPlace, {
                  pipetteId: pipette,
                  flowRate: blowoutFlowRateUlSec,
                }),
              ]
            : []
          const aspirateCorrectionVolumeForDispenseAirGap = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: dispenseAirGapVolume,
              liquidHandlingAction: 'aspirate',
            }
          )
          const getAirGapAfterDispenseCommands = (
            considerUltimateSubtransfer: boolean
          ): CurriedCommandCreator[] =>
            dispenseAirGapVolume > 0 &&
            // don't air gap if not last well in chunk and conditioning volume is present
            !(
              wellIndex < destWellChunk.length - 1 &&
              conditioningVolume != null &&
              conditioningVolume > 0
            ) &&
            // don't air gap if end of full transfer and not changing tip
            !(
              changeTip === 'never' &&
              isOverallUltimateDispense &&
              considerUltimateSubtransfer
            )
              ? [
                  curryCommandCreator(prepareToAspirate, {
                    pipetteId: pipette,
                  }),
                  curryCommandCreator(airGapInPlace, {
                    pipetteId: pipette,
                    volume: dispenseAirGapVolume,
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
          if (
            blowoutLocation == null ||
            !isLastWellInChunk // don't blowout if not last well
          ) {
            advancedDispenseArgsCommands = [
              ...getTouchTipAfterDispenseRetractCommands(true),
              ...getAirGapAfterDispenseCommands(true),
            ]
          } else if (blowoutLocation === DEST_WELL_BLOWOUT_DESTINATION) {
            advancedDispenseArgsCommands = [
              curryCommandCreator(moveToWell, {
                pipetteId: pipette,
                labwareId: destLabware,
                wellName: destinationWell,
                wellLocation: {
                  origin: WELL_ORIGIN_TOP,
                },
              }),
              ...blowoutInPlaceCommand,
              ...getTouchTipAfterDispenseRetractCommands(true),
              ...getAirGapAfterDispenseCommands(true),
            ]
          } else if (blowoutLocation === SOURCE_WELL_BLOWOUT_DESTINATION) {
            const finalAirGapAfterDispenseCommands = getAirGapAfterDispenseCommands(
              true
            )
            advancedDispenseArgsCommands = [
              ...getTouchTipAfterDispenseRetractCommands(false),
              ...getAirGapAfterDispenseCommands(false),
              curryCommandCreator(moveToWell, {
                pipetteId: pipette,
                labwareId: sourceLabware,
                wellName: sourceWell,
                wellLocation: {
                  origin: WELL_ORIGIN_TOP,
                },
              }),
              ...blowoutInPlaceCommand,
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
              ...(finalAirGapAfterDispenseCommands.length > 0
                ? [
                    curryCommandCreator(moveToWell, {
                      pipetteId: pipette,
                      labwareId: sourceLabware,
                      wellName: sourceWell,
                      wellLocation: { origin: WELL_ORIGIN_TOP },
                    }),
                  ]
                : []),
              ...finalAirGapAfterDispenseCommands,
            ]
          } else {
            // trash or waste chute
            advancedDispenseArgsCommands = [
              ...getTouchTipAfterDispenseRetractCommands(false),
              ...getAirGapAfterDispenseCommands(false),
              curryCommandCreator(moveToAddressableArea, {
                pipetteId: pipette,
                fixtureId: blowoutLocation,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
              }),
              ...blowoutInPlaceCommand,
              ...getAirGapAfterDispenseCommands(true),
            ]
          }

          return [
            ...dispenseSubmergeCommands,
            ...dispenseCommands,
            ...postDispenseRetractCommands,
            ...advancedDispenseArgsCommands,
          ]
        }
      )

      return [
        ...tipCommands,
        ...preAspirateSubmergeCommands,
        ...aspirateSubmergeCommands,
        ...mixBeforeAspirateCommands,
        ...preWetTipCommands,
        ...aspirateCommands,
        ...postAspirateRetractCommands,
        ...touchTipAfterAspirateRetractCommands,
        ...airGapAfterAspirateRetractCommands,
        ...dispenseChunkCommands,
      ]
    }
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
