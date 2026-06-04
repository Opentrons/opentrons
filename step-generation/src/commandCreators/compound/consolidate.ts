import chunk from 'lodash/chunk'
import flatMap from 'lodash/flatMap'

import {
  ALL,
  getAllLiquidClassDefs,
  getByVolumeValue,
  getFlexNameConversion,
  getIsTiprack,
  getMmFromBottom,
  GRIPPER_WASTE_CHUTE_ADDRESSABLE_AREA,
  isFlexPipette,
  LOW_VOLUME_PIPETTES,
  NONE_LIQUID_CLASS_NAME,
  PARTIAL_COLUMN,
  POSITION_REFERENCE_MAPPED_TO_WELL_ORIGIN,
  SAFE_MOVE_TO_WELL_LOCATION,
  WATER_LIQUID_CLASS_NAME,
  WELL_ORIGIN_TOP,
} from '@opentrons/shared-data'

import { MANUAL } from '../../constants'
import * as errorCreators from '../../errorCreators'
import { getNextTiprack } from '../../robotStateSelectors'
import {
  curryCommandCreator,
  curryWithoutPython,
  DEST_WELL_BLOWOUT_DESTINATION,
  formatChangeTipArg,
  formatPyStr,
  getIsRetractSafeForAirGap,
  getPipetteMovementSafetyStatus,
  getSlotInLocationStack,
  getTargetTipsFromWellSets,
  getTransferPlanAndReferenceVolumes,
  indentPyLines,
  PROTOCOL_CONTEXT_NAME,
  reduceCommandCreators,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '../../utils'
import { getTransformedWellsForPartialColumn } from '../../utils/getTransformedWellsForPartialColumn'
import {
  getCustomLiquidClassProperties,
  getLiquidClassName,
  getPythonAssignTipRacksString,
} from '../../utils/liquidClassUtils'
import {
  airGapInPlace,
  aspirateInPlace,
  blowOutInPlace,
  configureForVolume,
  delay,
  dispenseInPlace,
  dropTip,
  moveToAddressableArea,
  moveToWell,
  prepareToAspirate,
  touchTip,
} from '../atomic'
import { mixInPlaceUtil } from './mix'
import { replaceTip } from './replaceTip'

import type {
  PartialPrimaryNozzles,
  WellLocation,
} from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  ConsolidateArgs,
  CurriedCommandCreator,
  LabwareEntity,
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
    primaryNozzle,
    pushOut,
    sourceLabware,
    sourceWells,
    tipRack: userSelectedTipRackURI, // the tiprack the user selected, not necessarily the one used for this step
    tipTracking,
    tiprackSelected,
    tipsSelected,
    touchTipAfterAspirate,
    touchTipAfterAspirateMmFromEdge,
    touchTipAfterAspirateOffsetMmFromTop,
    touchTipAfterAspirateSpeed,
    touchTipAfterDispense,
    touchTipAfterDispenseMmFromEdge,
    touchTipAfterDispenseOffsetMmFromTop,
    touchTipAfterDispenseSpeed,
    stepNumber,
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
  const trashLikeIds = [
    ...Object.keys(invariantContext.trashBinEntities),
    ...Object.keys(invariantContext.wasteChuteEntities),
  ]

  const fallBackTrashLikeId = trashLikeIds.length > 0 ? trashLikeIds[0] : null

  // tiprack for return tip
  const dropTipLabware = Object.values(invariantContext.labwareEntities).find(
    ({ labwareDefURI }) => labwareDefURI === dropTipLocation
  )
  const isReturnTip = dropTipLabware != null && getIsTiprack(dropTipLabware.def)

  const isWasteChuteDropLocation =
    invariantContext.wasteChuteEntities[dropTipLocation] != null
  const isTrashBinDropLocation =
    invariantContext.trashBinEntities[dropTipLocation] != null

  const hasTip = prevRobotState.tipState.pipettes[pipette]?.hasTip

  if (
    dropTipLocation == null ||
    (isReturnTip &&
      fallBackTrashLikeId == null &&
      changeTip !== 'never' &&
      hasTip) ||
    (!isReturnTip && !isWasteChuteDropLocation && !isTrashBinDropLocation)
  ) {
    errors.push(errorCreators.dropTipLocationDoesNotExist())
  }

  let tiprackEntity: LabwareEntity | undefined, tiprackURI: string
  // TODO: We currently ask users to select a tip rack even if the tip handling policy
  // for this step is `never`, in which case we must ignore the tip rack the user selected
  // and use the tip rack from the previous step where we actually picked up the tip.
  if (changeTip === 'never') {
    const prevTiprackID = prevRobotState.tipState.pipettes[pipette]?.tiprackURI
    // pipettes[pipette].tiprackURI is a misnomer: it's an labwareID, not a URI
    tiprackEntity = invariantContext.labwareEntities[prevTiprackID ?? '']
    tiprackURI = tiprackEntity?.labwareDefURI
  } else {
    tiprackEntity = Object.values(labwareEntities).find(
      ({ labwareDefURI }) => labwareDefURI === userSelectedTipRackURI
    )
    tiprackURI = userSelectedTipRackURI
  }
  if (tiprackEntity == null) {
    if (changeTip === 'never') {
      errors.push(errorCreators.noTipOnPipette({ actionName, pipette }))
    } else {
      errors.push(
        errorCreators.labwareDoesNotExist({ actionName, labware: tiprackURI })
      )
    }
  }

  const { def: tiprackDefinition = null } = tiprackEntity ?? {}
  const {
    spec: pipetteSpecs,
    name: pipetteName,
    pythonName: pythonPipetteName,
  } = pipetteEntities[pipette]
  const liquidClassValuesForTip =
    getAllLiquidClassDefs()
      [
        liquidClass === NONE_LIQUID_CLASS_NAME || liquidClass == null
          ? WATER_LIQUID_CLASS_NAME
          : liquidClass
      ].byPipette?.find(
        ({ pipetteModel }) =>
          pipetteModel === getFlexNameConversion(pipetteSpecs)
      )
      ?.byTipType.find(({ tiprack }) => tiprack === tiprackURI) ?? null
  const { aspirate } = liquidClassValuesForTip ?? {}
  const { multiWellHandling } = getTransferPlanAndReferenceVolumes({
    pipetteSpecs,
    tiprackDefinition,
    volume,
    path: 'multiAspirate',
    numAspirateWells: sourceWells.length,
    numDispenseWells: 1,
    aspirateAirGapByVolume:
      (aspirate?.retract.airGapByVolume as Array<[number, number]>) ?? [],
    conditioningByVolume: null,
    disposalByVolume: null,
  })

  const { numWellsToFitInTip } = multiWellHandling

  if (
    // We stop users from selecting the consolidate path if we can't fit > 1 chunk into
    // the tip, but older protocols can have consolidate selected and trigger this error
    !multiWellHandling.isSupported ||
    numWellsToFitInTip == null ||
    numWellsToFitInTip === 1
  ) {
    errors.push(errorCreators.multiAspirateVolumeTooHigh())
  }

  if (isMultiChannelPipette && nozzles !== ALL) {
    const aspiratePipetteMovementSafetyStatus = getPipetteMovementSafetyStatus({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: sourceLabware,
      wellLocationOffset: { x: aspirateXOffset, y: aspirateYOffset },
      primaryNozzle,
      nozzleConfiguration: nozzles,
    })
    if (!aspiratePipetteMovementSafetyStatus.isSafe) {
      errors.push(
        errorCreators.possiblePipetteCollision({
          unsafePipetteMovementReason:
            aspiratePipetteMovementSafetyStatus.reason,
        })
      )
    }
    const dispensePipetteMovementSafetyStatus = getPipetteMovementSafetyStatus({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: destLabware,
      wellLocationOffset: { x: dispenseXOffset, y: dispenseYOffset },
      primaryNozzle,
      nozzleConfiguration: nozzles,
    })
    if (!dispensePipetteMovementSafetyStatus.isSafe) {
      errors.push(
        errorCreators.possiblePipetteCollision({
          unsafePipetteMovementReason:
            dispensePipetteMovementSafetyStatus.reason,
        })
      )
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
  const { tipracks } = getNextTiprack(
    pipette,
    tiprackURI,
    invariantContext,
    prevRobotState,
    primaryNozzle,
    nozzles
  )

  const aspirateCorrectionVolumeForSampleAspiration =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tiprackURI,
      targetVolume: volume,
      liquidHandlingAction: 'aspirate',
      byVolumeProperty: 'correctionByVolume',
      defaultValue: 0,
    }) ?? 0

  /** needed for python generation! */
  const destTrashPythonName =
    trashBinEntities[destLabware]?.pythonName ??
    wasteChuteEntities[destLabware]?.pythonName
  const trashPythonName =
    trashBinEntities[dropTipLocation]?.pythonName ??
    wasteChuteEntities[dropTipLocation]?.pythonName
  const blowoutTrashPythonName =
    blowoutLocation == null
      ? null
      : (trashBinEntities[blowoutLocation]?.pythonName ??
        wasteChuteEntities[blowoutLocation]?.pythonName)
  const sourceLabwarePythonName = labwareEntities[sourceLabware].pythonName
  const destLabwarePythonName = labwareEntities[destLabware]?.pythonName

  const transformedSourceWells =
    nozzles === PARTIAL_COLUMN
      ? getTransformedWellsForPartialColumn({
          labwareDef: labwareEntities[sourceLabware].def,
          wells: sourceWells,
          primaryNozzle: primaryNozzle as PartialPrimaryNozzles,
        })
      : sourceWells
  const transformedDestWell = (
    nozzles === PARTIAL_COLUMN &&
    destWell != null &&
    labwareEntities[destLabware] != null
      ? getTransformedWellsForPartialColumn({
          labwareDef: labwareEntities[destLabware].def,
          wells: [destWell],
          primaryNozzle: primaryNozzle as PartialPrimaryNozzles,
        })
      : [destWell]
  )[0]

  const pythonSourceWells = transformedSourceWells
    .map(well => `${sourceLabwarePythonName}[${formatPyStr(well)}]`)
    .join(', ')
  const pythonDestWells =
    transformedDestWell != null && destLabwarePythonName != null
      ? `${destLabwarePythonName}[${formatPyStr(transformedDestWell)}]`
      : null

  const pythonLiquidClassArgs = [
    `name=${formatPyStr(`${args.commandCreatorFnName}_step_${stepNumber}`)}`,
    ...(liquidClass != null
      ? [`base_liquid_class=${getLiquidClassName(liquidClass, true)}`]
      : []),
    `properties=${getCustomLiquidClassProperties({
      args,
      pipetteName: isFlexPipette(pipetteName)
        ? getFlexNameConversion(pipetteSpecs)
        : pipetteName,
      tiprackUri: tiprackURI,
      liquidClassValuesForTip,
    })}`,
  ]
  const customLiquidClass = `${PROTOCOL_CONTEXT_NAME}.define_liquid_class(\n${indentPyLines(
    pythonLiquidClassArgs.join(',\n')
  )},\n)`

  const shouldSelectManualTips =
    tipTracking === MANUAL &&
    tiprackSelected != null &&
    tipsSelected != null &&
    tipsSelected.length > 0
  const targetTips = shouldSelectManualTips
    ? getTargetTipsFromWellSets({
        wellSets: tipsSelected,
        nozzles,
        channels: pipetteSpecs.channels,
        primaryNozzle,
      })
    : null

  const transformedTargetTips =
    targetTips != null && tiprackEntity != null && nozzles === PARTIAL_COLUMN
      ? getTransformedWellsForPartialColumn({
          labwareDef: tiprackEntity?.def,
          wells: targetTips,
          primaryNozzle: primaryNozzle as PartialPrimaryNozzles,
        })
      : targetTips

  const tiprackName =
    tiprackSelected != null
      ? labwareEntities[tiprackSelected]?.pythonName
      : null
  const fullTipWellsToPickupString = transformedTargetTips
    ?.map(targetTip => `${tiprackName}[${formatPyStr(targetTip)}]`)
    .join(', ')

  const pythonArgs = [
    `volume=${volume}`,
    `source=[${pythonSourceWells}]`,
    `dest=${
      pythonDestWells != null ? `[${pythonDestWells}]` : destTrashPythonName
    }`,
    `new_tip=${formatPyStr(formatChangeTipArg(changeTip))}`,
    ...(isReturnTip
      ? [
          'return_tip=True',
          ...(blowoutTrashPythonName != null
            ? [`trash_location=${blowoutTrashPythonName}`]
            : []),
        ]
      : [`trash_location=${trashPythonName}`, 'keep_last_tip=True']),
    ...(pipetteSpecs.channels > 1 ? [`group_wells=False`] : []),
    ...(tipracks.filteredSortedTiprackIds.length > 0
      ? [
          getPythonAssignTipRacksString({
            labwareEntities,
            tiprackIds: tipracks.filteredSortedTiprackIds,
          }),
        ]
      : []),
    `liquid_class=${customLiquidClass}`,
    ...(targetTips != null && tiprackName != null
      ? [`tips=[${fullTipWellsToPickupString}]`]
      : []),
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
      tiprackDefUri: tiprackURI,
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
      tiprackDefUri: tiprackURI,
      targetVolume: aspirateAirGapVolume,
      liquidHandlingAction: 'aspirate',
      byVolumeProperty: 'flowRateByVolume',
      defaultValue: null,
    }) ?? aspirateFlowRateUlSec
  const aspirateAirGapDispenseFlowRate =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tiprackURI,
      targetVolume: aspirateAirGapVolume,
      liquidHandlingAction: 'singleDispense',
      byVolumeProperty: 'flowRateByVolume',
      defaultValue: null,
    }) ?? dispenseFlowRateUlSec
  const dispenseAirGapAspirateFlowRate =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tiprackURI,
      targetVolume: dispenseAirGapVolume,
      liquidHandlingAction: 'aspirate',
      byVolumeProperty: 'flowRateByVolume',
      defaultValue: null,
    }) ?? aspirateFlowRateUlSec
  const dispenseAirGapDispenseFlowRate =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tiprackURI,
      targetVolume: dispenseAirGapVolume,
      liquidHandlingAction: 'singleDispense',
      byVolumeProperty: 'flowRateByVolume',
      defaultValue: null,
    }) ?? dispenseFlowRateUlSec

  const isDispenseRetractSafeForAirGap = getIsRetractSafeForAirGap({
    retractZOffset: dispenseRetractZOffset,
    retractPositionReference: dispenseRetractPositionReference,
    labwareId: destLabware,
    labwareEntities,
    well: destWell,
  })
  const preDispenseAirGapMoveToCommand =
    !isDispenseRetractSafeForAirGap && destWell != null
      ? [
          curryWithoutPython(moveToWell, {
            pipetteId: pipette,
            labwareId: destLabware,
            wellName: destWell,
            wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
          }),
        ]
      : []

  const jsonCommandCreators = flatMap(
    sourceWellChunks,
    (
      sourceWellChunk: string[],
      chunkIndex: number
    ): CurriedCommandCreator[] => {
      const getAirGapAfterDispenseCommands = (
        considerUltimateSubtransfer: boolean,
        considerRetractSafety: boolean = true
      ): CurriedCommandCreator[] =>
        dispenseAirGapVolume > 0 &&
        // don't air gap if end of full transfer and not changing tip
        !(changeTip === 'never' && isLastChunk && considerUltimateSubtransfer)
          ? [
              ...(considerRetractSafety ? preDispenseAirGapMoveToCommand : []),
              curryWithoutPython(prepareToAspirate, {
                pipetteId: pipette,
              }),
              curryWithoutPython(airGapInPlace, {
                pipetteId: pipette,
                volume: dispenseAirGapVolume,
                flowRate: dispenseAirGapAspirateFlowRate,
                ...(aspirateCorrectionVolumeForDispenseAirGap > 0
                  ? {
                      correctionVolume:
                        aspirateCorrectionVolumeForDispenseAirGap,
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
              // if retract isn't safe for air gap, air gap commands will include a move to well safe position
              ...(getAirGapAfterDispenseCommands(considerUltimateSubtransfer)
                .length > 0 && isDispenseRetractSafeForAirGap
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

      let tipCommands: CurriedCommandCreator[] = []
      if (changeTipNow) {
        const nextTip = targetTips?.shift()
        tipCommands = [
          curryCommandCreator(replaceTip, {
            pipette,
            primaryNozzle,
            nozzles,
            dropTipLocation:
              isReturnTip && fallBackTrashLikeId != null
                ? fallBackTrashLikeId
                : dropTipLocation,
            tipRack: tiprackURI,
            ...(tipTracking === MANUAL &&
            nextTip != null &&
            tiprackSelected != null
              ? {
                  tipSelectionArgs: {
                    tipRackId: tiprackSelected,
                    tipWell: nextTip,
                  },
                }
              : {}),
          }),
        ]
      }

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
          const isAspirateRetractSafeForAirGap = getIsRetractSafeForAirGap({
            retractZOffset: aspirateRetractZOffset,
            retractPositionReference: aspirateRetractPositionReference,
            labwareId: sourceLabware,
            labwareEntities,
            well: sourceWell,
          })
          const preAspirateAirGapMoveToCommand =
            !isAspirateRetractSafeForAirGap && sourceWell != null
              ? [
                  curryWithoutPython(moveToWell, {
                    pipetteId: pipette,
                    labwareId: sourceLabware,
                    wellName: sourceWell,
                    wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
                  }),
                ]
              : []
          const dispenseCorrectionVolumeForDispenseAirGap =
            getByVolumeValue({
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tiprackURI,
              targetVolume: airGapInTip,
              liquidHandlingAction: 'singleDispense',
              byVolumeProperty: 'correctionByVolume',
              defaultValue: 0,
            }) ?? 0
          const configureForVolumeAndPrepareToAspirateCommands: CurriedCommandCreator[] =
            isFirstWellInChunk
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
                          correctionVolume:
                            dispenseCorrectionVolumeForDispenseAirGap,
                        }
                      : {}),
                    isAirGap: true,
                    pushOut: 0,
                  }),
                  ...delayAfterDispenseCommands,
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
                // if retract isn't safe for air gap, air gap commands will include a move to well safe position
                ...(aspirateAirGapVolume > 0 && isAspirateRetractSafeForAirGap
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
              tiprackDefUri: tiprackURI,
              targetVolume: aspirateAirGapVolume,
              liquidHandlingAction: 'aspirate',
              byVolumeProperty: 'correctionByVolume',
              defaultValue: 0,
            }) ?? 0
          const airGapAfterAspirateRetractCommands =
            aspirateAirGapVolume > 0
              ? [
                  ...preAspirateAirGapMoveToCommand,
                  curryWithoutPython(airGapInPlace, {
                    pipetteId: pipette,
                    volume: aspirateAirGapVolume,
                    flowRate: aspirateAirGapAspirateFlowRate,
                    ...(aspirateCorrectionVolumeForAspirateAirGap > 0
                      ? {
                          correctionVolume:
                            aspirateCorrectionVolumeForAspirateAirGap,
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
          tiprackDefUri: tiprackURI,
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
                isAirGap: true,
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
          tiprackDefUri: tiprackURI,
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
              tiprackDefUri: tiprackURI,
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
              tiprackDefUri: tiprackURI,
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
              tiprack: tiprackURI,
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
          ...getAirGapAfterDispenseCommands(true, false),
        ]
      }
      const returnTipCommands: CurriedCommandCreator[] =
        isReturnTip &&
        (chunkIndex === sourceWellChunks.length - 1 || changeTip === 'always')
          ? [
              curryWithoutPython(dropTip, {
                pipette,
                dropTipLocation: tiprackURI,
                isReturnTip,
              }),
            ]
          : []

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
        ...returnTipCommands,
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
