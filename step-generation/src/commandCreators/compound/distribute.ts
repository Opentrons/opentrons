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
import {
  getNextTiprack,
  getPipetteWithTipMaxVol,
} from '../../robotStateSelectors'
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
  CurriedCommandCreator,
  DistributeArgs,
  LabwareEntity,
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
    primaryNozzle,
    pushOut,
    sourceLabware,
    sourceWell,
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
  // TODO Ian 2018-05-03 next ~20 lines match consolidate.js
  const actionName = 'distribute'
  const errors: CommandCreatorError[] = []
  const isMultiChannelPipette = pipetteEntities[pipette]?.spec.channels !== 1
  const isTouchTipDisabled =
    labwareEntities[sourceLabware]?.def.parameters.quirks?.includes(
      'touchTipDisabled'
    )
  const aspirateAirGapVolume = args.aspirateAirGapVolume ?? 0
  const dispenseAirGapVolume = args.dispenseAirGapVolume ?? 0
  const disposalVolume =
    args.disposalVolume != null && args.disposalVolume > 0
      ? args.disposalVolume
      : 0
  const conditioningVolume =
    args.conditioningVolume != null && args.conditioningVolume > 0
      ? args.conditioningVolume
      : 0
  // TODO: Ian 2019-04-19 revisit these pipetteDoesNotExist errors, how to do it DRY?
  if (
    prevRobotState.pipettes[pipette] == null ||
    pipetteEntities[pipette] == null
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
  const { aspirate, multiDispense } = liquidClassValuesForTip ?? {}
  const { multiWellHandling } = getTransferPlanAndReferenceVolumes({
    pipetteSpecs,
    tiprackDefinition,
    volume,
    path: 'multiDispense',
    numAspirateWells: 1,
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
    // We stop users from selecting the distribute path if we can't fit > 1 chunk into
    // the tip, but older protocols can have distributed selected and trigger this error
    !multiWellHandling.isSupported ||
    numWellsToFitInTip == null ||
    numWellsToFitInTip === 1
  ) {
    errors.push(errorCreators.multiDispenseVolumeTooHigh())
  }

  if (isMultiChannelPipette && nozzles !== ALL) {
    const aspiratePipetteMovementSafetyStatus = getPipetteMovementSafetyStatus({
      robotState: prevRobotState,
      invariantContext,
      pipetteId: pipette,
      labwareId: sourceLabware,
      wellLocationOffset: { x: aspirateXOffset, y: aspirateYOffset },
      wellTargetName: sourceWell,
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
      wellTargetName: destWells[0],
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
    curryWithoutPython(moveToWell, {
      pipetteId: pipette,
      labwareId: sourceLabware,
      wellName: sourceWell,
      wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
    }),
  ]

  const maxVolume =
    getPipetteWithTipMaxVol(pipette, invariantContext, tiprackURI) -
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

  const dispenseCorrectionVolumeForDestination =
    getByVolumeValue({
      liquidClass,
      pipetteSpecs,
      tiprackDefUri: tiprackURI,
      targetVolume: volume,
      liquidHandlingAction: 'multiDispense',
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

  const transformedSourceWell = (
    nozzles === PARTIAL_COLUMN
      ? getTransformedWellsForPartialColumn({
          labwareDef: labwareEntities[sourceLabware].def,
          wells: [sourceWell],
          primaryNozzle: primaryNozzle as PartialPrimaryNozzles,
        })
      : [sourceWell]
  )[0]
  const transformedDestWells =
    nozzles === PARTIAL_COLUMN &&
    destWells != null &&
    labwareEntities[destLabware] != null
      ? getTransformedWellsForPartialColumn({
          labwareDef: labwareEntities[destLabware].def,
          wells: destWells,
          primaryNozzle: primaryNozzle as PartialPrimaryNozzles,
        })
      : destWells

  const pythonSourceWells = `${sourceLabwarePythonName}[${formatPyStr(
    transformedSourceWell
  )}]`
  const pythonDestWells = transformedDestWells
    .map(well => `${destLabwarePythonName}[${formatPyStr(well)}]`)
    .join(', ')

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

  const tiprackName =
    tiprackSelected != null
      ? labwareEntities[tiprackSelected]?.pythonName
      : null
  const transformedTargetTips =
    targetTips != null && tiprackEntity != null && nozzles === PARTIAL_COLUMN
      ? getTransformedWellsForPartialColumn({
          labwareDef: tiprackEntity?.def,
          wells: targetTips,
          primaryNozzle: primaryNozzle as PartialPrimaryNozzles,
        })
      : targetTips
  const fullTipWellsToPickupString = transformedTargetTips
    ?.map(targetTip => `${tiprackName}[${formatPyStr(targetTip)}]`)
    .join(', ')

  const pythonArgs = [
    `volume=${volume}`,
    `source=[${pythonSourceWells}]`,
    `dest=[${pythonDestWells ?? destTrashPythonName}]`,
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
    python: `${pythonPipetteName}.distribute_with_liquid_class(\n${indentPyLines(
      pythonArgs.join(',\n')
    )},\n)`,
  })
  /** < until here */

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
      liquidHandlingAction: 'multiDispense',
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
      liquidHandlingAction: 'multiDispense',
      byVolumeProperty: 'flowRateByVolume',
      defaultValue: null,
    }) ?? dispenseFlowRateUlSec

  const destWellChunks = chunk(destWells, numWellsToFitInTip)

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

  const jsonCommandCreators = flatMap(
    destWellChunks,
    (destWellChunk: string[], chunkIndex: number): CurriedCommandCreator[] => {
      const numDestsPerAsp = destWellChunk.length // can differ on final chunk
      const totalSampleAspirateVolume = volume * numDestsPerAsp
      const totalGrossAspirateVolume =
        totalSampleAspirateVolume + disposalVolume + conditioningVolume
      const isFirstChunk = chunkIndex === 0
      const isLastChunk = chunkIndex === destWellChunks.length - 1
      const changeTipNow =
        // path is in ['always', 'once', 'never']
        changeTip === 'always' || (changeTip === 'once' && isFirstChunk)

      const configureForVolumeCommand = LOW_VOLUME_PIPETTES.includes(
        pipetteName
      )
        ? [
            curryWithoutPython(configureForVolume, {
              pipetteId: pipette,
              volume: totalGrossAspirateVolume,
            }),
          ]
        : []

      let tipCommands: CurriedCommandCreator[] = []
      if (changeTipNow) {
        const nextTip = targetTips?.shift()
        tipCommands = [
          curryCommandCreator(replaceTip, {
            pipette,
            nozzles,
            primaryNozzle,
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
      const prepareToAspirateCommand = [
        curryWithoutPython(prepareToAspirate, {
          pipetteId: pipette,
        }),
      ]
      const dispenseCorrectionVolumeForDispenseAirGap =
        getByVolumeValue({
          liquidClass,
          pipetteSpecs,
          tiprackDefUri: tiprackURI,
          targetVolume: dispenseAirGapVolume,
          liquidHandlingAction: 'multiDispense',
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
      const voidDispenseAirGapCommand =
        dispenseAirGapVolume > 0 &&
        !changeTipNow &&
        !isFirstChunk &&
        disposalVolume === 0 &&
        blowoutLocation == null
          ? [
              curryWithoutPython(dispenseInPlace, {
                isAirGap: true,
                pipetteId: pipette,
                volume: dispenseAirGapVolume,
                flowRate: dispenseAirGapDispenseFlowRate,
                ...(dispenseCorrectionVolumeForDispenseAirGap > 0
                  ? {
                      correctionVolume:
                        dispenseCorrectionVolumeForDispenseAirGap,
                    }
                  : {}),
                pushOut: 0,
              }),
              ...delayAfterDispenseCommands,
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
        ...(aspirateSubmergeDelay != null && aspirateSubmergeDelay.seconds > 0
          ? [
              curryWithoutPython(delay, {
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
            tiprack: tiprackURI,
            generatePython: false,
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
              tiprack: tiprackURI,
              generatePython: false,
            })
          : []
      const delayAfterAspirateCommands =
        aspirateDelay != null
          ? [
              curryWithoutPython(delay, {
                seconds: aspirateDelay.seconds,
              }),
            ]
          : []

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
      const aspirateCorrectionVolumeForTotalAspiration =
        getByVolumeValue({
          liquidClass,
          pipetteSpecs,
          tiprackDefUri: tiprackURI,
          targetVolume: totalGrossAspirateVolume,
          liquidHandlingAction: 'aspirate',
          byVolumeProperty: 'correctionByVolume',
          defaultValue: 0,
        }) ?? 0
      const dispenseCorrectionVolumeForConditioningVolume =
        getByVolumeValue({
          liquidClass,
          pipetteSpecs,
          tiprackDefUri: tiprackURI,
          targetVolume: conditioningVolume,
          liquidHandlingAction: 'multiDispense',
          byVolumeProperty: 'correctionByVolume',
          defaultValue: 0,
        }) ?? 0
      const dispenseConditioningVolumeCommands =
        conditioningVolume != null && conditioningVolume > 0
          ? [
              curryWithoutPython(dispenseInPlace, {
                pipetteId: pipette,
                volume: conditioningVolume,
                flowRate: dispenseFlowRateUlSec,
                correctionVolume: dispenseCorrectionVolumeForConditioningVolume,
                pushOut: 0,
              }),
              ...delayAfterDispenseCommands,
            ]
          : []
      const aspirateCommands = [
        curryWithoutPython(aspirateInPlace, {
          pipetteId: pipette,
          volume: totalGrossAspirateVolume,
          flowRate: aspirateFlowRateUlSec,
          correctionVolume: aspirateCorrectionVolumeForTotalAspiration,
        }),
        ...delayAfterAspirateCommands,
        ...dispenseConditioningVolumeCommands,
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
        ...(aspirateRetractDelay != null && aspirateRetractDelay?.seconds > 0
          ? [
              curryWithoutPython(delay, {
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
          let airGapDispenseFlowRate = dispenseFlowRateUlSec
          if (isFirstWellInChunk && aspirateAirGapVolume > 0) {
            airGapInTip = aspirateAirGapVolume
            airGapDispenseFlowRate = aspirateAirGapDispenseFlowRate
          } else if (
            !isFirstWellInChunk &&
            dispenseAirGapVolume > 0 &&
            conditioningVolume === 0
          ) {
            airGapInTip = dispenseAirGapVolume
            airGapDispenseFlowRate = dispenseAirGapDispenseFlowRate
          }
          const dispenseCorrectionVolumeForAirGap =
            getByVolumeValue({
              liquidClass,
              pipetteSpecs,
              tiprackDefUri: tiprackURI,
              targetVolume: airGapInTip,
              liquidHandlingAction: 'multiDispense',
              byVolumeProperty: 'correctionByVolume',
              defaultValue: 0,
            }) ?? 0

          const isDispenseRetractSafeForAirGap = getIsRetractSafeForAirGap({
            retractZOffset: dispenseRetractZOffset,
            retractPositionReference: dispenseRetractPositionReference,
            labwareId: destLabware,
            labwareEntities,
            well: destinationWell,
          })
          const preDispenseAirGapMoveToCommand = !isDispenseRetractSafeForAirGap
            ? [
                curryWithoutPython(moveToWell, {
                  pipetteId: pipette,
                  labwareId: destLabware,
                  wellName: destinationWell,
                  wellLocation: SAFE_MOVE_TO_WELL_LOCATION,
                }),
              ]
            : []

          const dispenseSubmergeCommands =
            destinationWell != null
              ? [
                  curryWithoutPython(moveToWell, {
                    pipetteId: pipette,
                    labwareId: destLabware,
                    wellName: destinationWell,
                    wellLocation: dispenseSubmergeLocation,
                  }),
                  ...(airGapInTip > 0
                    ? [
                        curryWithoutPython(dispenseInPlace, {
                          isAirGap: true,
                          pipetteId: pipette,
                          volume: airGapInTip,
                          flowRate: airGapDispenseFlowRate,
                          pushOut: 0,
                          correctionVolume: dispenseCorrectionVolumeForAirGap,
                        }),
                        ...delayAfterDispenseCommands,
                      ]
                    : []),
                  curryWithoutPython(moveToWell, {
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
                        curryWithoutPython(delay, {
                          seconds: dispenseSubmergeDelay.seconds,
                        }),
                      ]
                    : []),
                ]
              : [
                  curryWithoutPython(moveToAddressableArea, {
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

          const dispenseCommands = [
            curryWithoutPython(dispenseInPlace, {
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
                  curryWithoutPython(moveToWell, {
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
                        curryWithoutPython(delay, {
                          seconds: dispenseRetractDelay.seconds,
                        }),
                      ]
                    : []),
                ]
              : []
          const blowoutInPlaceCommand = isLastWellInChunk
            ? [
                curryWithoutPython(blowOutInPlace, {
                  pipetteId: pipette,
                  flowRate: blowoutFlowRateUlSec,
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
          const getAirGapAfterDispenseCommands = (
            considerUltimateSubtransfer: boolean,
            considerRetractSafety: boolean = true
          ): CurriedCommandCreator[] =>
            dispenseAirGapVolume > 0 &&
            // don't air gap if not last well in chunk and conditioning volume is present
            !(wellIndex < destWellChunk.length - 1 && conditioningVolume > 0) &&
            // don't air gap if end of full transfer and not changing tip
            !(
              changeTip === 'never' &&
              isOverallUltimateDispense &&
              considerUltimateSubtransfer
            )
              ? [
                  ...(considerRetractSafety
                    ? preDispenseAirGapMoveToCommand
                    : []),
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
            destinationWell != null && touchTipAfterDispense
              ? [
                  curryWithoutPython(touchTip, {
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
                  // if retract isn't safe for air gap, air gap commands will include a move to well safe position
                  ...(getAirGapAfterDispenseCommands(
                    considerUltimateSubtransfer
                  ).length > 0 && isDispenseRetractSafeForAirGap
                    ? [
                        curryWithoutPython(moveToWell, {
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
              curryWithoutPython(moveToWell, {
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
            const finalAirGapAfterDispenseCommands =
              getAirGapAfterDispenseCommands(true)
            advancedDispenseArgsCommands = [
              ...getTouchTipAfterDispenseRetractCommands(false),
              ...getAirGapAfterDispenseCommands(false),
              curryWithoutPython(moveToWell, {
                pipetteId: pipette,
                labwareId: sourceLabware,
                wellName: sourceWell,
                wellLocation: {
                  origin: WELL_ORIGIN_TOP,
                },
              }),
              ...blowoutInPlaceCommand,
              // touch tip at source well with source touch tip parameters
              // only if source is touchTip-able
              ...(touchTipAfterDispense && !isTouchTipDisabled
                ? [
                    curryWithoutPython(touchTip, {
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
                    curryWithoutPython(moveToWell, {
                      pipetteId: pipette,
                      labwareId: sourceLabware,
                      wellName: sourceWell,
                      wellLocation: { origin: WELL_ORIGIN_TOP },
                    }),
                  ]
                : []),
              ...getAirGapAfterDispenseCommands(true, false),
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
              ...blowoutInPlaceCommand,
              ...getAirGapAfterDispenseCommands(true, false),
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

      const returnTipCommands: CurriedCommandCreator[] =
        isReturnTip &&
        (chunkIndex === destWellChunks.length - 1 || changeTip === 'always')
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
        ...preAspirateSubmergeCommands,
        ...aspirateSubmergeCommands,
        ...mixBeforeAspirateCommands,
        ...preWetTipCommands,
        ...aspirateCommands,
        ...postAspirateRetractCommands,
        ...touchTipAfterAspirateRetractCommands,
        ...airGapAfterAspirateRetractCommands,
        ...dispenseChunkCommands,
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
