import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'

import {
  ALL,
  getAllLiquidClassDefs,
  getByVolumeValue,
  getFlexNameConversion,
  getMmFromBottom,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  isFlexPipette,
  LOW_VOLUME_PIPETTES,
  NONE_LIQUID_CLASS_NAME,
  POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN,
  SAFE_MOVE_TO_WELL_LOCATION,
  WATER_LIQUID_CLASS_NAME,
  WELL_ORIGIN_TOP,
} from '@opentrons/shared-data'

import * as errorCreators from '../../errorCreators'
import {
  curryWithoutPython,
  DEST_WELL_BLOWOUT_DESTINATION,
  formatPyStr,
  getIsSafePipetteMovement,
  getSlotInLocationStack,
  getTransferPlanAndReferenceVolumes,
  indentPyLines,
  PROTOCOL_CONTEXT_NAME,
  reduceCommandCreators,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '../../utils'
import {
  getCustomLiquidClassProperties,
  getPythonLiquidClassName,
} from '../../utils/liquidClassUtils'
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
    stepId,
    volume,
  } = args
  const {
    pipetteEntities,
    labwareEntities,
    trashBinEntities,
    wasteChuteEntities,
  } = invariantContext

  const actionName = 'consolidate'
  const errors: CommandCreatorError[] = []
  const pipetteData = prevRobotState.pipettes[pipette]
  const isMultiChannelPipette = pipetteEntities[pipette]?.spec.channels !== 1

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
    (labwareEntities[destLabware] == null &&
      trashBinEntities[destLabware] == null &&
      wasteChuteEntities[destLabware] == null)
  ) {
    errors.push(errorCreators.equipmentDoesNotExist())
  }

  const initialDestLabwareSlot = getSlotInLocationStack(
    prevRobotState.labware[destLabware]?.stack
  )
  const initialSourceLabwareSlot = getSlotInLocationStack(
    prevRobotState.labware[sourceLabware]?.stack
  )
  const hasWasteChute = Object.keys(wasteChuteEntities).length > 0

  if (
    hasWasteChute &&
    (initialDestLabwareSlot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA ||
      initialSourceLabwareSlot === GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA)
  ) {
    errors.push(errorCreators.labwareDiscarded())
  }

  const isWasteChuteDropTipLocation =
    wasteChuteEntities[dropTipLocation] != null
  const isTrashBinDropTipLocation = trashBinEntities[dropTipLocation] != null

  if (
    !dropTipLocation ||
    (!isWasteChuteDropTipLocation && !isTrashBinDropTipLocation)
  ) {
    errors.push(errorCreators.dropTipLocationDoesNotExist())
  }
  const tiprack = Object.values(labwareEntities).find(
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
    pythonName: pythonPipetteName,
  } = pipetteEntities[pipette]
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
      ? labwareEntities[sourceLabware]?.def.wells[destWell]?.depth
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

  const aspirateCorrectionVolumeForSampleAspiration =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tipRack,
      targetVolume: volume,
      liquidHandlingAction: 'aspirate',
      byVolumeProperty: 'correctionByVolume',
      defaultValue: 0,
    }) ?? 0
  const dispenseCorrectionForTotalDispense =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tipRack,
      targetVolume: volume,
      liquidHandlingAction: 'singleDispense',
      byVolumeProperty: 'correctionByVolume',
      defaultValue: 0,
    }) ?? 0
  /** needed for python generation! > */
  const destTrashPipetteName =
    trashBinEntities[destLabware]?.pythonName ??
    wasteChuteEntities[destLabware]?.pythonName
  const trashPipetteName =
    trashBinEntities[dropTipLocation]?.pythonName ??
    wasteChuteEntities[dropTipLocation]?.pythonName
  const sourceLabwarePythonName = labwareEntities[sourceLabware].pythonName
  const destLabwarePythonName = labwareEntities[destLabware]?.pythonName
  const pythonSourceWells = sourceWells
    .map(well => `${sourceLabwarePythonName}[${formatPyStr(well)}]`)
    .join(', ')
  const pythonDestWells =
    args.destWell != null && destLabwarePythonName != null
      ? `${destLabwarePythonName}[${formatPyStr(args.destWell)}]`
      : null

  const pythonLiquidClassArgs = [
    `name=${formatPyStr(`${args.commandCreatorFnName}_step_${stepId}`)}`,
    ...(liquidClass != null
      ? [`base_liquid_class=${getPythonLiquidClassName(liquidClass)}`]
      : []),
    `properties=${getCustomLiquidClassProperties({
      args,
      pipetteName: isFlexPipette(pipetteName)
        ? getFlexNameConversion(pipetteSpecs)
        : pipetteName,
      tiprackUri: tipRack,
      aspirateCorrectionVolume: aspirateCorrectionVolumeForSampleAspiration,
      dispenseCorrectionVolume: dispenseCorrectionForTotalDispense,
    })}`,
  ]
  const customLiquidClass = `${PROTOCOL_CONTEXT_NAME}.define_liquid_class(\n${indentPyLines(
    pythonLiquidClassArgs.join(',\n')
  )},\n)`

  const pythonArgs = [
    `volume=${volume}`,
    `source=[${pythonSourceWells}]`,
    `dest=${
      pythonDestWells != null ? `[${pythonDestWells}]` : destTrashPipetteName
    }`,
    //  TODO: fix bug where new_tip api arg does not allow
    //  changeTip: always but PD does
    `new_tip=${formatPyStr(changeTip)}`,
    `trash_location=${trashPipetteName}`,
    ...(pipetteSpecs.channels > 1 ? [`group_wells=False`] : []),
    `liquid_class=${customLiquidClass}`,
  ]
  const pythonCommandCreator: CurriedCommandCreator = () => ({
    commands: [],
    python: `${pythonPipetteName}.consolidate_with_liquid_class(\n${indentPyLines(
      pythonArgs.join(',\n')
    )},\n)`,
  })
  /** < until here */

  const sourceWellChunks = chunk(sourceWells, numWellsToFitInTip)

  const configureForVolumeCommand = LOW_VOLUME_PIPETTES.includes(pipetteName)
    ? [
        curryWithoutPython(configureForVolume, {
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
          curryWithoutPython(delay, {
            seconds: aspirateDelay.seconds,
          }),
        ]
      : []
  const aspirateCorrectionVolumeForDispenseAirGap =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tipRack,
      targetVolume: dispenseAirGapVolume,
      liquidHandlingAction: 'aspirate',
      byVolumeProperty: 'correctionByVolume',
      defaultValue: 0,
    }) ?? 0
  const delayAfterDispenseCommands =
    dispenseDelay != null
      ? [
          curryWithoutPython(delay, {
            seconds: dispenseDelay.seconds,
          }),
        ]
      : []

  const aspirateAirGapAspirateFlowRate =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tipRack,
      targetVolume: aspirateAirGapVolume,
      liquidHandlingAction: 'aspirate',
      byVolumeProperty: 'flowRateByVolume',
      defaultValue: null,
    }) ?? aspirateFlowRateUlSec
  const aspirateAirGapDispenseFlowRate =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tipRack,
      targetVolume: aspirateAirGapVolume,
      liquidHandlingAction: 'singleDispense',
      byVolumeProperty: 'flowRateByVolume',
      defaultValue: null,
    }) ?? dispenseFlowRateUlSec
  const dispenseAirGapAspirateFlowRate =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tipRack,
      targetVolume: dispenseAirGapVolume,
      liquidHandlingAction: 'aspirate',
      byVolumeProperty: 'flowRateByVolume',
      defaultValue: null,
    }) ?? aspirateFlowRateUlSec
  const dispenseAirGapDispenseFlowRate =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tipRack,
      targetVolume: dispenseAirGapVolume,
      liquidHandlingAction: 'singleDispense',
      byVolumeProperty: 'flowRateByVolume',
      defaultValue: null,
    }) ?? dispenseFlowRateUlSec

  const jsonCommandCreators = flatMap(
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
              curryWithoutPython(prepareToAspirate, {
                pipetteId: pipette,
              }),
              curryWithoutPython(airGapInPlace, {
                pipetteId: pipette,
                volume: dispenseAirGapVolume,
                flowRate: dispenseAirGapAspirateFlowRate,
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
              curryWithoutPython(touchTip, {
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
                    curryWithoutPython(moveToWell, {
                      pipetteId: pipette,
                      labwareId: destLabware,
                      wellName: destWell,
                      wellLocation: dispenseRetractLocation,
                    }),
                  ]
                : []),
            ]
          : []

      const isFirstChunk = chunkIndex === 0
      const isLastChunk = chunkIndex === sourceWellChunks.length - 1
      const numSourcesPerAsp = sourceWellChunk.length // can differ on final chunk
      const totalSampleDispenseVolume = volume * numSourcesPerAsp

      const changeTipNow =
        // path is in ['always', 'once', 'never']
        changeTip === 'always' || (changeTip === 'once' && isFirstChunk)

      const tipCommands = changeTipNow
        ? [
            curryWithoutPython(replaceTip, {
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
          let airGapDispenseFlowRate = dispenseFlowRateUlSec
          if (isFirstWellInChunk && !changeTipNow && !isFirstChunk) {
            airGapInTip = dispenseAirGapVolume
            airGapDispenseFlowRate = dispenseAirGapDispenseFlowRate
          } else if (!isFirstWellInChunk) {
            airGapInTip = aspirateAirGapVolume
            airGapDispenseFlowRate = aspirateAirGapDispenseFlowRate
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
          const dispenseCorrectionVolumeForDispenseAirGap =
            getByVolumeValue({
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: airGapInTip,
              liquidHandlingAction: 'singleDispense',
              byVolumeProperty: 'correctionByVolume',
              defaultValue: 0,
            }) ?? 0
          const configureForVolumeAndPrepareToAspirateCommands: CurriedCommandCreator[] = isFirstWellInChunk
            ? [
                ...(LOW_VOLUME_PIPETTES.includes(
                  invariantContext.pipetteEntities[pipette].name
                )
                  ? [
                      curryWithoutPython(configureForVolume, {
                        pipetteId: pipette,
                        volume: totalSampleDispenseVolume,
                      }),
                    ]
                  : []),
                curryWithoutPython(prepareToAspirate, {
                  pipetteId: pipette,
                }),
              ]
            : []
          const voidAirGapAtAspirateWellCommands =
            airGapInTip > 0
              ? [
                  curryWithoutPython(dispenseInPlace, {
                    pipetteId: pipette,
                    volume: airGapInTip,
                    flowRate: airGapDispenseFlowRate,
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
            curryWithoutPython(moveToWell, {
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
          //     curryWithoutPython(liquidProbe, {
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
            curryWithoutPython(moveToWell, {
              pipetteId: pipette,
              labwareId: sourceLabware,
              wellName: sourceWell,
              wellLocation: aspirateSubmergeLocation,
            }),
            curryWithoutPython(moveToWell, {
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
                  curryWithoutPython(delay, {
                    seconds: aspirateSubmergeDelay.seconds,
                  }),
                ]
              : []),
          ]
          const touchTipAfterAspirateRetractCommands = touchTipAfterAspirate
            ? [
                curryWithoutPython(touchTip, {
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
                      curryWithoutPython(moveToWell, {
                        pipetteId: pipette,
                        labwareId: sourceLabware,
                        wellName: sourceWell,
                        wellLocation: aspirateRetractLocation,
                      }),
                    ]
                  : []),
              ]
            : []
          const aspirateCorrectionVolumeForAspirateAirGap =
            getByVolumeValue({
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: aspirateAirGapVolume,
              liquidHandlingAction: 'aspirate',
              byVolumeProperty: 'correctionByVolume',
              defaultValue: 0,
            }) ?? 0
          const airGapAfterAspirateRetractCommands =
            aspirateAirGapVolume > 0
              ? [
                  curryWithoutPython(airGapInPlace, {
                    pipetteId: pipette,
                    volume: aspirateAirGapVolume,
                    flowRate: aspirateAirGapAspirateFlowRate,
                    ...(aspirateCorrectionVolumeForAspirateAirGap > 0
                      ? {
                          correctionVolume: aspirateCorrectionVolumeForAspirateAirGap,
                        }
                      : {}),
                  }),
                  ...delayAfterAspirateCommands,
                ]
              : []
          const aspirateCommands = [
            curryWithoutPython(aspirateInPlace, {
              pipetteId: pipette,
              volume,
              flowRate: aspirateFlowRateUlSec,
              correctionVolume: aspirateCorrectionVolumeForSampleAspiration,
            }),
            ...delayAfterAspirateCommands,
          ]
          const postAspirateRetractCommands = [
            curryWithoutPython(moveToWell, {
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
                  curryWithoutPython(delay, {
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
              curryWithoutPython(moveToWell, {
                pipetteId: pipette,
                labwareId: destLabware,
                wellName: destWell,
                wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
              }),
              curryWithoutPython(moveToWell, {
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
              curryWithoutPython(moveToAddressableArea, {
                pipetteId: pipette,
                fixtureId: destLabware,
                offset: {
                  x: 0,
                  y: 0,
                  z: 0,
                },
              }),
            ]

      const dispenseCorrectionVolumeForAspirateAirGap =
        getByVolumeValue({
          liquidClass,
          pipetteSpecs,
          tiprackDefUri: tipRack,
          targetVolume: aspirateAirGapVolume,
          liquidHandlingAction: 'singleDispense',
          byVolumeProperty: 'correctionByVolume',
          defaultValue: 0,
        }) ?? 0
      const voidAirGapAtDispenseWellCommands =
        aspirateAirGapVolume > 0
          ? [
              curryWithoutPython(dispenseInPlace, {
                pipetteId: pipette,
                volume: aspirateAirGapVolume,
                flowRate: aspirateAirGapDispenseFlowRate,
                pushOut: 0,
                correctionVolume: dispenseCorrectionVolumeForAspirateAirGap,
              }),
              ...delayAfterDispenseCommands,
            ]
          : []

      const dispenseSubmergeCommands =
        destWell != null
          ? [
              curryWithoutPython(moveToWell, {
                pipetteId: pipette,
                labwareId: destLabware,
                wellName: destWell,
                wellLocation: dispenseSubmergeLocation,
              }),
              curryWithoutPython(moveToWell, {
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
                    curryWithoutPython(delay, {
                      seconds: dispenseSubmergeDelay.seconds,
                    }),
                  ]
                : []),
            ]
          : []

      const dispenseCorrectionForTotalDispense =
        getByVolumeValue({
          liquidClass,
          pipetteSpecs,
          tiprackDefUri: tipRack,
          targetVolume: totalSampleDispenseVolume,
          liquidHandlingAction: 'singleDispense',
          byVolumeProperty: 'correctionByVolume',
          defaultValue: 0,
        }) ?? 0
      // don't push out if mixing in destination
      const effectivePushOut = mixInDestination != null ? 0 : pushOut
      const dispenseCommands = [
        curryWithoutPython(dispenseInPlace, {
          pipetteId: pipette,
          volume: totalSampleDispenseVolume,
          flowRate: dispenseFlowRateUlSec,
          ...(effectivePushOut != null ? { pushOut: effectivePushOut } : {}),
          correctionVolume: dispenseCorrectionForTotalDispense,
        }),
        ...delayAfterDispenseCommands,
      ]
      const mixAspirateFlowRate =
        (mixInDestination != null
          ? getByVolumeValue({
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: mixInDestination.volume,
              liquidHandlingAction: 'aspirate',
              byVolumeProperty: 'flowRateByVolume',
              defaultValue: null,
            })
          : aspirateFlowRateUlSec) ?? aspirateFlowRateUlSec
      const mixDispenseFlowRate =
        (mixInDestination != null
          ? getByVolumeValue({
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tipRack,
              targetVolume: mixInDestination.volume,
              liquidHandlingAction: 'singleDispense',
              byVolumeProperty: 'flowRateByVolume',
              defaultValue: null,
            })
          : dispenseFlowRateUlSec) ?? dispenseFlowRateUlSec
      const mixInDestinationCommands =
        mixInDestination != null
          ? mixInPlaceUtil({
              pipette,
              volume: mixInDestination.volume,
              times: mixInDestination.times,
              aspirateFlowRateUlSec: mixAspirateFlowRate,
              dispenseFlowRateUlSec: mixDispenseFlowRate,
              aspirateDelaySeconds: aspirateDelay?.seconds,
              dispenseDelaySeconds: dispenseDelay?.seconds,
              finalPushOut: pushOut,
              invariantContext,
              liquidClass,
              tiprack: tipRack,
              generatePython: false,
            })
          : []
      const blowOutInPlaceCommand = [
        curryWithoutPython(blowOutInPlace, {
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
          curryWithoutPython(moveToWell, {
            pipetteId: pipette,
            labwareId: destLabware,
            wellName: destWell,
            wellLocation: {
              origin: WELL_ORIGIN_TOP,
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
          curryWithoutPython(moveToAddressableArea, {
            pipetteId: pipette,
            fixtureId:
              Object.values(trashBinEntities).length > 0
                ? Object.values(trashBinEntities)[0].id
                : Object.values(wasteChuteEntities)[0].id,
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
  const commandCreators = [...jsonCommandCreators, pythonCommandCreator]
  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
