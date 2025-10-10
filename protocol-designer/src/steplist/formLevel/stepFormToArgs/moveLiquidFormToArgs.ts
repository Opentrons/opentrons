import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  NONE_LIQUID_CLASS_NAME,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  getTransferPlanAndReferenceVolumes,
} from '@opentrons/step-generation'

import {
  DEFAULT_MM_OFFSET_FROM_BOTTOM,
  DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP,
} from '../../../constants'
import { getMatchingTipLiquidSpecs } from '../../../utils'
import { getOrderedWells } from '../../utils'
import { getMoveLiquidDelayData } from './getDelayData'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  ConsolidateArgs,
  DistributeArgs,
  InnerMixArgs,
  InvariantContext,
  PathOption,
  TransferArgs,
} from '@opentrons/step-generation'
import type { HydratedMoveLiquidFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

// NOTE(sa, 2020-08-11): leaving this as fn so it can be expanded later for dispense air gap
export function getAirGapData(
  castFormData: GetCastFormData<HydratedMoveLiquidFormData>,
  checkboxField: 'aspirate_airGap_checkbox' | 'dispense_airGap_checkbox',
  volumeField: 'aspirate_airGap_volume' | 'dispense_airGap_volume'
): number | null {
  const checkbox = castFormData[checkboxField]
  const volume = castFormData[volumeField]

  if (checkbox && typeof volume === 'number' && volume > 0) {
    return volume
  }

  return null
}
export function getMixData(
  castFormData: GetCastFormData<HydratedMoveLiquidFormData>,
  checkboxField: 'aspirate_mix_checkbox' | 'dispense_mix_checkbox',
  volumeField: 'aspirate_mix_volume' | 'dispense_mix_volume',
  timesField: 'aspirate_mix_times' | 'dispense_mix_times'
): InnerMixArgs | null | undefined {
  const checkbox = castFormData[checkboxField]
  const volume = castFormData[volumeField]
  const times = castFormData[timesField]

  if (
    checkbox &&
    typeof volume === 'number' &&
    volume > 0 &&
    typeof times === 'number' &&
    times > 0
  ) {
    return {
      volume,
      times,
    }
  }

  return null
}

const getCheckedPath = (
  castFormData: GetCastFormData<HydratedMoveLiquidFormData>,
  contextualState: InvariantContext,
  path: PathOption
): PathOption => {
  const { pipette, tipRack, volume } = castFormData
  const { spec: pipetteSpecs } = pipette
  const tiprackEntity = Object.values(contextualState.labwareEntities).find(
    lw => lw.labwareDefURI === tipRack
  )
  // should not hit
  if (tiprackEntity == null) {
    console.error('Tiprack for transfer has no associated labware entity.')
    return path
  }
  const { labwareDefURI: tiprackDefUri, def: tiprackDef } = tiprackEntity
  const allLiquidClassDefs = getAllLiquidClassDefs()
  const liquidClassValuesForTip = allLiquidClassDefs[
    castFormData.liquidClass === NONE_LIQUID_CLASS_NAME ||
    castFormData.liquidClass == null
      ? WATER_LIQUID_CLASS_NAME
      : castFormData.liquidClass ?? null
  ]?.byPipette
    .find(
      ({ pipetteModel }) => (pipetteModel = getFlexNameConversion(pipetteSpecs))
    )
    ?.byTipType.find(({ tiprack }) => tiprack === tiprackDefUri)

  // be permissive with path if no liquid class tip values found
  if (liquidClassValuesForTip == null) {
    return path
  }
  if (
    path === 'single' ||
    // if liquid class values are found and path is 'multiDispense', make sure multiDispense object is defined
    // this should be enforced by UI in liquid class selection, but this is another safeguard
    (path === 'multiDispense' && liquidClassValuesForTip.multiDispense == null)
  ) {
    return 'single'
  }

  const { multiWellHandling } =
    path === 'multiAspirate'
      ? getTransferPlanAndReferenceVolumes({
          pipetteSpecs,
          tiprackDefinition: tiprackDef,
          volume,
          path,
          numAspirateWells: castFormData.aspirate_wells.length,
          numDispenseWells: castFormData.dispense_wells.length,
          aspirateAirGapByVolume: liquidClassValuesForTip.aspirate.retract
            .airGapByVolume as Array<[number, number]>,
          conditioningByVolume: null,
          disposalByVolume: null,
        })
      : getTransferPlanAndReferenceVolumes({
          pipetteSpecs,
          tiprackDefinition: tiprackDef,
          volume,
          path,
          numAspirateWells: castFormData.aspirate_wells.length,
          numDispenseWells: castFormData.dispense_wells.length,
          aspirateAirGapByVolume: liquidClassValuesForTip.aspirate.retract
            .airGapByVolume as Array<[number, number]>,
          conditioningByVolume:
            (liquidClassValuesForTip.multiDispense
              ?.conditioningByVolume as Array<[number, number]>) ?? null,
          disposalByVolume:
            (liquidClassValuesForTip.multiDispense?.disposalByVolume as Array<
              [number, number]
            >) ?? null,
        })
  if (
    !multiWellHandling.isSupported ||
    multiWellHandling.numWellsToFitInTip === 1
  ) {
    return 'single'
  }
  // checked multiAspirate/Dispense and is safe
  return path
}
type MoveLiquidStepArgs = ConsolidateArgs | DistributeArgs | TransferArgs | null
export const moveLiquidFormToArgs = (
  castFormData: GetCastFormData<HydratedMoveLiquidFormData>,
  contextualState: InvariantContext
): MoveLiquidStepArgs => {
  console.assert(
    castFormData.stepType === 'moveLiquid',
    `moveLiquidFormToArgs called with stepType ${castFormData.stepType}, expected "moveLiquid"`
  )
  const pipetteId = castFormData.pipette.id
  const {
    volume,
    aspirate_labware: sourceLabware,
    dispense_labware: destLabware,
    aspirate_wells: sourceWellsUnordered,
    dispense_wells: destWellsUnordered,
    dropTip_location: dropTipLocation,
    path,
    tipRack,
    nozzles,
    aspirate_x_position,
    dispense_x_position,
    aspirate_y_position,
    dispense_y_position,
    pushOut_checkbox,
    pushOut_volume,
  } = castFormData
  let sourceWells = getOrderedWells(
    castFormData.aspirate_wells,
    sourceLabware.def,
    castFormData.aspirate_wellOrder_first,
    castFormData.aspirate_wellOrder_second
  )

  const isDispensingIntoDisposalLocation =
    'name' in destLabware &&
    (destLabware.name === 'wasteChute' || destLabware.name === 'trashBin')

  let def: LabwareDefinition2 | null = null
  let dispWells: string[] = []

  if ('def' in destLabware) {
    def = destLabware.def
    dispWells = destWellsUnordered
  }
  let destWells =
    !isDispensingIntoDisposalLocation && def != null
      ? getOrderedWells(
          dispWells,
          def,
          castFormData.dispense_wellOrder_first,
          castFormData.dispense_wellOrder_second
        )
      : null

  // 1:many with single path: spread well array of length 1 to match other well array
  // distribute 1:many can not happen into the waste chute or trash bin
  if (destWells != null && !isDispensingIntoDisposalLocation) {
    if (path === 'single' && sourceWells.length !== destWells.length) {
      if (sourceWells.length === 1) {
        sourceWells = Array(destWells.length).fill(sourceWells[0])
      } else if (destWells.length === 1) {
        destWells = Array(sourceWells.length).fill(destWells[0])
      }
    }
  }

  const disposalVolume = castFormData.disposalVolume_checkbox
    ? castFormData.disposalVolume_volume
    : null
  const touchTipAfterAspirate = Boolean(castFormData.aspirate_touchTip_checkbox)
  const touchTipAfterAspirateOffsetMmFromTop =
    castFormData.aspirate_touchTip_mmFromTop ??
    DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP
  const touchTipAfterAspirateSpeed =
    castFormData.aspirate_touchTip_speed ?? null
  const touchTipAfterAspirateMmFromEdge =
    castFormData.aspirate_touchTip_mmFromEdge ?? null
  const touchTipAfterDispense = Boolean(castFormData.dispense_touchTip_checkbox)
  const touchTipAfterDispenseOffsetMmFromTop =
    castFormData.dispense_touchTip_mmFromTop ??
    DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP
  const touchTipAfterDispenseSpeed =
    castFormData.dispense_touchTip_speed ?? null
  const touchTipAfterDispenseMmFromEdge =
    castFormData.dispense_touchTip_mmFromEdge ?? null

  const mixBeforeAspirate = getMixData(
    castFormData,
    'aspirate_mix_checkbox',
    'aspirate_mix_volume',
    'aspirate_mix_times'
  )
  const mixInDestination = getMixData(
    castFormData,
    'dispense_mix_checkbox',
    'dispense_mix_volume',
    'dispense_mix_times'
  )
  const aspirateDelay = getMoveLiquidDelayData({
    castFormData: castFormData,
    secondsField: 'aspirate_delay_seconds',
    checkboxField: 'aspirate_delay_checkbox',
  })
  const dispenseDelay = getMoveLiquidDelayData({
    castFormData: castFormData,
    secondsField: 'dispense_delay_seconds',
    checkboxField: 'dispense_delay_checkbox',
  })
  const aspirateSubmergeDelay = getMoveLiquidDelayData({
    castFormData: castFormData,
    secondsField: 'aspirate_submerge_delay_seconds',
  })
  const dispenseSubmergeDelay = getMoveLiquidDelayData({
    castFormData: castFormData,
    secondsField: 'dispense_submerge_delay_seconds',
  })
  const aspirateRetractDelay = getMoveLiquidDelayData({
    castFormData: castFormData,
    secondsField: 'aspirate_retract_delay_seconds',
  })
  const dispenseRetractDelay = getMoveLiquidDelayData({
    castFormData: castFormData,
    secondsField: 'dispense_retract_delay_seconds',
  })
  const blowoutLocation =
    (castFormData.blowout_checkbox && castFormData.blowout_location) ||
    (castFormData.disposalVolume_checkbox &&
      path === 'multiDispense' &&
      castFormData.disposalVolume_volume &&
      castFormData.blowout_location) ||
    null

  const aspirateAirGapVolume = getAirGapData(
    castFormData,
    'aspirate_airGap_checkbox',
    'aspirate_airGap_volume'
  )
  const dispenseAirGapVolume = getAirGapData(
    castFormData,
    'dispense_airGap_checkbox',
    'dispense_airGap_volume'
  )
  const matchingTipLiquidSpecs = getMatchingTipLiquidSpecs(
    castFormData.pipette,
    castFormData.volume,
    tipRack
  )
  const conditioningVolume =
    castFormData.conditioning_checkbox === true &&
    castFormData.conditioning_volume != null &&
    castFormData.conditioning_volume > 0
      ? castFormData.conditioning_volume
      : 0

  const commonFields = {
    pipette: pipetteId,
    volume,
    sourceLabware: sourceLabware.id,
    destLabware: destLabware.id,
    tipRack,
    aspirateFlowRateUlSec:
      castFormData.aspirate_flowRate ||
      matchingTipLiquidSpecs.defaultAspirateFlowRate.default,
    dispenseFlowRateUlSec:
      castFormData.dispense_flowRate ||
      matchingTipLiquidSpecs.defaultDispenseFlowRate.default,
    aspirateOffsetFromBottomMm:
      castFormData.aspirate_mmFromBottom || DEFAULT_MM_OFFSET_FROM_BOTTOM,
    dispenseOffsetFromBottomMm:
      castFormData.dispense_mmFromBottom || DEFAULT_MM_OFFSET_FROM_BOTTOM,
    blowoutFlowRateUlSec:
      castFormData.blowout_flowRate ||
      matchingTipLiquidSpecs.defaultBlowOutFlowRate.default,
    changeTip: castFormData.changeTip,
    preWetTip: Boolean(castFormData.preWetTip),
    aspirateDelay,
    dispenseDelay,
    aspirateSubmergeDelay,
    dispenseSubmergeDelay,
    aspirateRetractDelay,
    dispenseRetractDelay,
    aspirateAirGapVolume,
    dispenseAirGapVolume,
    touchTipAfterAspirate,
    touchTipAfterAspirateOffsetMmFromTop,
    touchTipAfterAspirateSpeed,
    touchTipAfterAspirateMmFromEdge,
    touchTipAfterDispense,
    touchTipAfterDispenseOffsetMmFromTop,
    touchTipAfterDispenseSpeed,
    touchTipAfterDispenseMmFromEdge,
    description: castFormData.stepDetails,
    name: castFormData.stepName,
    //  TODO(jr, 7/26/24): wire up wellNames
    dropTipLocation,
    nozzles,
    aspirateXOffset: aspirate_x_position ?? 0,
    aspirateYOffset: aspirate_y_position ?? 0,
    aspirateZOffset:
      castFormData.aspirate_mmFromBottom ?? DEFAULT_MM_OFFSET_FROM_BOTTOM,
    aspiratePositionReference: castFormData.aspirate_position_reference,
    dispenseXOffset: dispense_x_position ?? 0,
    dispenseYOffset: dispense_y_position ?? 0,
    dispenseZOffset:
      castFormData.dispense_mmFromBottom ?? DEFAULT_MM_OFFSET_FROM_BOTTOM,
    dispensePositionReference: castFormData.dispense_position_reference,
    aspirateSubmergeSpeed: castFormData.aspirate_submerge_speed ?? null,
    aspirateSubmergeXOffset: castFormData.aspirate_submerge_x_position ?? 0,
    aspirateSubmergeYOffset: castFormData.aspirate_submerge_y_position ?? 0,
    aspirateSubmergeZOffset: castFormData.aspirate_submerge_mmFromBottom ?? 0,
    aspirateSubmergePositionReference:
      castFormData.aspirate_submerge_position_reference,
    aspirateRetractSpeed: castFormData.aspirate_retract_speed ?? null,
    aspirateRetractXOffset: castFormData.aspirate_retract_x_position ?? 0,
    aspirateRetractYOffset: castFormData.aspirate_retract_y_position ?? 0,
    aspirateRetractZOffset: castFormData.aspirate_retract_mmFromBottom ?? 0,
    aspirateRetractPositionReference:
      castFormData.aspirate_retract_position_reference,
    dispenseSubmergeSpeed: castFormData.dispense_submerge_speed ?? null,
    dispenseSubmergeXOffset: castFormData.dispense_submerge_x_position ?? 0,
    dispenseSubmergeYOffset: castFormData.dispense_submerge_y_position ?? 0,
    dispenseSubmergeZOffset: castFormData.dispense_submerge_mmFromBottom ?? 0,
    dispenseSubmergePositionReference:
      castFormData.dispense_submerge_position_reference,
    dispenseRetractSpeed: castFormData.dispense_retract_speed ?? null,
    dispenseRetractYOffset: castFormData.dispense_retract_y_position ?? 0,
    dispenseRetractZOffset: castFormData.dispense_retract_mmFromBottom ?? 0,
    dispenseRetractPositionReference:
      castFormData.dispense_retract_position_reference,
    dispenseRetractXOffset: castFormData.dispense_retract_x_position ?? 0,
    pushOut: pushOut_checkbox ? pushOut_volume : 0,
    liquidClass:
      castFormData.liquidClass === NONE_LIQUID_CLASS_NAME // transform "none" (needed in step form) to null
        ? null
        : castFormData.liquidClass ?? null,
  }
  console.assert(
    sourceWellsUnordered.length > 0,
    'expected sourceWells to have length > 0'
  )
  console.assert(
    !(
      path === 'multiDispense' &&
      blowoutLocation === DEST_WELL_BLOWOUT_DESTINATION
    ),
    'blowout location for multiDispense cannot be destination well'
  )

  if (!isDispensingIntoDisposalLocation && dispWells.length === 0) {
    console.error('expected to have destWells.length > 0 but got none')
  }

  console.assert(
    !(path === 'multiDispense' && destWells == null),
    'cannot distribute when destWells is null'
  )

  const checkedPath = getCheckedPath(castFormData, contextualState, path)

  switch (checkedPath) {
    case 'single': {
      const transferStepArguments: TransferArgs = {
        ...commonFields,
        commandCreatorFnName: 'transfer',
        blowoutLocation,
        sourceWells,
        destWells,
        mixBeforeAspirate,
        mixInDestination,
      }
      return transferStepArguments
    }

    case 'multiAspirate': {
      const consolidateStepArguments: ConsolidateArgs = {
        ...commonFields,
        commandCreatorFnName: 'consolidate',
        blowoutLocation,
        mixFirstAspirate: mixBeforeAspirate,
        mixInDestination,
        sourceWells,
        destWell: destWells != null ? destWells[0] : null,
      }
      return consolidateStepArguments
    }

    case 'multiDispense': {
      const distributeStepArguments: DistributeArgs = {
        ...commonFields,
        commandCreatorFnName: 'distribute',
        disposalVolume,
        conditioningVolume,
        // distribute needs blowout location field because disposal volume checkbox might be checked without blowout checkbox being checked
        blowoutLocation,
        mixBeforeAspirate,
        sourceWell: sourceWells[0],
        // cannot distribute into a waste chute so if destWells is null
        // there is an error
        destWells: destWells ?? [],
      }
      return distributeStepArguments
    }

    default: {
      console.assert(
        false,
        `moveLiquidFormToArgs got unexpected "path" field value: ${path}`
      )
      return null
    }
  }
}
