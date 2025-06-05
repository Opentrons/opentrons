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
  ConsolidateArgs,
  CurriedCommandCreator,
} from '../../types'

export const consolidate: CommandCreator<ConsolidateArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /**
    Consolidate will aspirate several times in sequence from multiple source wells,
    then dispense into a single destination.
     If the volume to aspirate from the source wells exceeds the max volume of the pipette,
    then consolidate will be broken up into multiple asp-asp-disp, asp-asp-disp cycles.
     A single uniform volume will be aspirated from every source well.
     =====
     For consolidate, changeTip means:
    * 'always': before the first aspirate in a single asp-asp-disp cycle, get a fresh tip
    * 'once': get a new tip at the beginning of the consolidate step, and use it throughout
    * 'never': reuse the tip from the last step
  */

  // TODO: BC 2019-07-08 these argument names are a bit misleading, instead of being values bound
  // to the action of aspiration of dispensing in a given command, they are actually values bound
  // to a given labware associated with a command (e.g. Source, Destination). For this reason we
  // currently remapping the inner mix values. Those calls to mixUtil should become easier to read
  // when we decide to rename these fields/args... probably all the way up to the UI level.
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
    blowoutOffsetFromTopMm,
    changeTip,
    destLabware,
    destWell,
    dispenseDelay,
    dispenseFlowRateUlSec,
    dispensePositionReference,
    dispenseRetractPositionReference,
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
    mixInDestination,
    nozzles,
    pipette,
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

  const actionName = 'consolidate'
  const errors: CommandCreatorError[] = []
  const pipetteData = prevRobotState.pipettes[pipette]
  const isMultiChannelPipette =
    invariantContext.pipetteEntities[pipette]?.spec.channels !== 1

  const aspirateAirGapVolume = args.aspirateAirGapVolume ?? 0
  const dispenseAirGapVolume = args.dispenseAirGapVolume ?? 0

  if (pipetteData == null) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        pipette,
      })
    )
  }

  if (
    destLabware == null ||
    (invariantContext.labwareEntities[destLabware] == null &&
      invariantContext.trashBinEntities[destLabware] == null &&
      invariantContext.wasteChuteEntities[destLabware] == null)
  ) {
    errors.push(errorCreators.equipmentDoesNotExist())
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
  const { aspirate } = liquidClassValuesForTip ?? {}
  const { multiWellHandling } = getTransferPlanAndReferenceVolumes({
    pipetteSpecs,
    tiprackDefinition,
    volume,
    path: 'multiAspirate',
    numDispenseWells: sourceWells.length,
    aspirateAirGapByVolume:
      (aspirate?.retract.airGapByVolume as Array<[number, number]>) ?? [],
    conditioningByVolume: null,
    disposalByVolume: null,
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
    })
    const isDispenseSafePipetteMovement = getIsSafePipetteMovement({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: destLabware,
      wellLocationOffset: { x: dispenseXOffset, y: dispenseYOffset },
    })
    if (!isAspirateSafePipetteMovement && !isDispenseSafePipetteMovement) {
      errors.push(errorCreators.possiblePipetteCollision())
    }
  }
  const dispenseWellDepth =
    destWell != null
      ? invariantContext.labwareEntities[sourceLabware]?.def.wells[destWell]
          ?.depth
      : null
  const dispenseMmFromBottom = getMmFromBottom(
    dispenseZOffset,
    dispensePositionReference,
    dispenseWellDepth
  )
  const dispenseSubmergeMmFromBottom = getMmFromBottom(
    dispenseSubmergeZOffset,
    dispenseSubmergePositionReference,
    dispenseWellDepth
  )

  const dispenseRetractMmFromBottom = getMmFromBottom(
    dispenseRetractZOffset,
    dispenseRetractPositionReference,
    dispenseWellDepth
  )
  if (
    dispenseMmFromBottom != null &&
    dispenseSubmergeMmFromBottom != null &&
    dispenseMmFromBottom > dispenseSubmergeMmFromBottom
  ) {
    errors.push(errorCreators.submergeBelowDispense())
  }
  if (
    dispenseMmFromBottom != null &&
    dispenseRetractMmFromBottom != null &&
    dispenseMmFromBottom > dispenseRetractMmFromBottom
  ) {
    errors.push(errorCreators.retractBelowDispense())
  }

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  const sourceWellChunks = chunk(sourceWells, numWellsToFitInTip)

  const configureForVolumeCommand = LOW_VOLUME_PIPETTES.includes(pipetteName)
    ? [
        curryCommandCreator(configureForVolume, {
          pipetteId: pipette,
          volume,
        }),
      ]
    : []

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
  const delayAfterAspirateCommands =
    aspirateDelay != null
      ? [
          curryCommandCreator(delay, {
            seconds: aspirateDelay.seconds,
          }),
        ]
      : []
  const aspirateCorrectionVolumeForDispenseAirGap = getCorrectionVolume({
    liquidClass,
    pipetteSpecs,
    tiprackDefUri: tipRack,
    targetVolume: dispenseAirGapVolume,
    liquidHandlingAction: 'aspirate',
  })
  const delayAfterDispenseCommands =
    dispenseDelay != null
      ? [
          curryCommandCreator(delay, {
            seconds: dispenseDelay.seconds,
          }),
        ]
      : []

  const commandCreators = flatMap(
    sourceWellChunks,
    (
      sourceWellChunk: string[],
      chunkIndex: number
    ): CurriedCommandCreator[] => {
      const getAirGapAfterDispenseCommands = (
        considerUltimateSubtransfer: boolean
      ): CurriedCommandCreator[] =>
        dispenseAirGapVolume > 0 &&
        // don't air gap if end of full transfer and not changing tip
        !(changeTip === 'never' && isLastChunk && considerUltimateSubtransfer)
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
        destWell != null && touchTipAfterDispense
          ? [
              curryCommandCreator(touchTip, {
                pipetteId: pipette,
                labwareId: destLabware,
                wellName: destWell,
                ...(touchTipAfterDispenseMmFromEdge != null
                  ? { mmFromEdge: touchTipAfterDispenseMmFromEdge }
                  : {}),
                zOffsetFromTop: touchTipAfterDispenseOffsetMmFromTop,
                ...(touchTipAfterDispenseSpeed != null
                  ? { speed: touchTipAfterDispenseSpeed }
                  : {}),
              }),
              // move back to retract position after touch tip if air gap needed
              ...(getAirGapAfterDispenseCommands(considerUltimateSubtransfer)
                .length > 0
                ? [
                    curryCommandCreator(moveToWell, {
                      pipetteId: pipette,
                      labwareId: destLabware,
                      wellName: destWell,
                      wellLocation: dispenseRetractLocation,
                    }),
                  ]
                : []),
            ]
          : []

      const numSourcesPerAsp = sourceWellChunk.length // can differ on final chunk
      const totalSampleDispenseVolume = volume * numSourcesPerAsp
      const isFirstChunk = chunkIndex === 0
      const isLastChunk = chunkIndex === sourceWellChunks.length - 1
      const changeTipNow =
        // path is in ['always', 'once', 'never']
        changeTip === 'always' || (changeTip === 'once' && isFirstChunk)

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

      // Aspirate commands for all source wells in the chunk
      const aspirateCommands = flatMap(
        sourceWellChunk,
        (sourceWell: string, wellIndex: number): CurriedCommandCreator[] => {
          const isFirstWellInChunk = wellIndex === 0
          let airGapInTip = 0
          if (isFirstWellInChunk && !changeTipNow && !isFirstChunk) {
            airGapInTip = dispenseAirGapVolume
          } else if (!isFirstWellInChunk) {
            airGapInTip = aspirateAirGapVolume
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
          const dispenseCorrectionVolumeForDispenseAirGap = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: airGapInTip,
              liquidHandlingAction: 'singleDispense',
            }
          )
          const configureForVolumeAndPrepareToAspirateCommands: CurriedCommandCreator[] = isFirstWellInChunk
            ? [
                ...(LOW_VOLUME_PIPETTES.includes(
                  invariantContext.pipetteEntities[pipette].name
                )
                  ? [
                      curryCommandCreator(configureForVolume, {
                        pipetteId: pipette,
                        volume: totalSampleDispenseVolume,
                      }),
                    ]
                  : []),
                curryCommandCreator(prepareToAspirate, {
                  pipetteId: pipette,
                }),
              ]
            : []
          const voidAirGapAtAspirateWellCommands =
            airGapInTip > 0
              ? [
                  curryCommandCreator(dispenseInPlace, {
                    pipetteId: pipette,
                    volume: airGapInTip,
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
          const moveToSourceWellTopCommand = [
            curryCommandCreator(moveToWell, {
              pipetteId: pipette,
              labwareId: sourceLabware,
              wellName: sourceWell,
              wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
            }),
          ]
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
          const preAspirateSubmergeCommands = [
            ...moveToSourceWellTopCommand,
            ...voidAirGapAtAspirateWellCommands,
            // ...liquidProbeCommand, // for menisucs-relative pipetting
            ...configureForVolumeAndPrepareToAspirateCommands,
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
          const aspirateCorrectionVolumeForAspirateAirGap = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: aspirateAirGapVolume,
              liquidHandlingAction: 'aspirate',
            }
          )
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
          const aspirateCorrectionVolumeForSampleAspiration = getCorrectionVolume(
            {
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: volume,
              liquidHandlingAction: 'aspirate',
            }
          )
          const aspirateCommands = [
            curryCommandCreator(aspirateInPlace, {
              pipetteId: pipette,
              volume,
              flowRate: aspirateFlowRateUlSec,
              correctionVolume: aspirateCorrectionVolumeForSampleAspiration,
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

          return [
            ...preAspirateSubmergeCommands,
            ...aspirateSubmergeCommands,
            ...aspirateCommands,
            ...postAspirateRetractCommands,
            ...touchTipAfterAspirateRetractCommands,
            ...airGapAfterAspirateRetractCommands,
          ]
        }
      )

      const moveToDispenseLocationCommands =
        // destination is well
        destWell != null
          ? [
              curryCommandCreator(moveToWell, {
                pipetteId: pipette,
                labwareId: destLabware,
                wellName: destWell,
                wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
              }),
              curryCommandCreator(moveToWell, {
                pipetteId: pipette,
                labwareId: destLabware,
                wellName: destWell,
                wellLocation: dispenseSubmergeLocation,
                ...(dispenseSubmergeSpeed != null
                  ? { speed: dispenseSubmergeSpeed }
                  : {}),
              }),
            ]
          : // destination is trash or waste chute
            [
              curryCommandCreator(moveToAddressableArea, {
                pipetteId: pipette,
                fixtureId: destLabware,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
              }),
            ]

      const dispenseCorrectionVolumeForAspirateAirGap = getCorrectionVolume({
        liquidClass,
        pipetteSpecs,
        tiprackDefUri: tipRack,
        targetVolume: aspirateAirGapVolume,
        liquidHandlingAction: 'singleDispense',
      })
      const voidAirGapAtDispenseWellCommands =
        aspirateAirGapVolume > 0
          ? [
              curryCommandCreator(dispenseInPlace, {
                pipetteId: pipette,
                volume: aspirateAirGapVolume,
                flowRate: dispenseFlowRateUlSec,
                pushOut: 0,
                correctionVolume: dispenseCorrectionVolumeForAspirateAirGap,
              }),
              ...delayAfterDispenseCommands,
            ]
          : []

      const dispenseSubmergeCommands =
        destWell != null
          ? [
              curryCommandCreator(moveToWell, {
                pipetteId: pipette,
                labwareId: destLabware,
                wellName: destWell,
                wellLocation: dispenseSubmergeLocation,
              }),
              curryCommandCreator(moveToWell, {
                pipetteId: pipette,
                labwareId: destLabware,
                ...(dispenseSubmergeSpeed != null
                  ? { speed: dispenseSubmergeSpeed }
                  : {}),
                wellName: destWell,
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
          : []

      const dispenseCorrectionForTotalDispense = getCorrectionVolume({
        liquidClass,
        pipetteSpecs,
        tiprackDefUri: tipRack,
        targetVolume: totalSampleDispenseVolume,
        liquidHandlingAction: 'singleDispense',
      })
      // don't push out if mixing in destination
      const effectivePushOut = mixInDestination != null ? 0 : pushOut
      const dispenseCommands = [
        curryCommandCreator(dispenseInPlace, {
          pipetteId: pipette,
          volume: totalSampleDispenseVolume,
          flowRate: dispenseFlowRateUlSec,
          ...(effectivePushOut != null ? { pushOut: effectivePushOut } : {}),
          correctionVolume: dispenseCorrectionForTotalDispense,
        }),
        ...delayAfterDispenseCommands,
      ]
      const mixInDestinationCommands =
        mixInDestination != null
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
      const blowOutInPlaceCommand = [
        curryCommandCreator(blowOutInPlace, {
          pipetteId: pipette,
          flowRate: blowoutFlowRateUlSec,
        }),
      ]

      let advancedDispenseArgsCommands: CurriedCommandCreator[] = []
      if (
        blowoutLocation == null ||
        // should be disallowed in UI, but just in case
        blowoutLocation === SOURCE_WELL_BLOWOUT_DESTINATION
      ) {
        advancedDispenseArgsCommands = [
          ...getTouchTipAfterDispenseRetractCommands(true),
          ...getAirGapAfterDispenseCommands(true),
        ]
      } else if (
        blowoutLocation === DEST_WELL_BLOWOUT_DESTINATION &&
        destWell != null
      ) {
        advancedDispenseArgsCommands = [
          curryCommandCreator(moveToWell, {
            pipetteId: pipette,
            labwareId: destLabware,
            wellName: destWell,
            wellLocation: {
              origin: WELL_ORIGIN_TOP,
              offset: {
                x: 0,
                y: 0,
                z: blowoutOffsetFromTopMm,
              },
            },
          }),

          ...blowOutInPlaceCommand,
          ...getTouchTipAfterDispenseRetractCommands(true),
          ...getAirGapAfterDispenseCommands(true),
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
          ...blowOutInPlaceCommand,
          ...getAirGapAfterDispenseCommands(true),
        ]
      }

      return [
        ...tipCommands,
        ...configureForVolumeCommand,
        ...aspirateCommands,
        ...moveToDispenseLocationCommands,
        ...voidAirGapAtDispenseWellCommands,
        ...dispenseSubmergeCommands,
        ...dispenseCommands,
        ...mixInDestinationCommands,
        ...advancedDispenseArgsCommands,
      ]
    }
  )
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
