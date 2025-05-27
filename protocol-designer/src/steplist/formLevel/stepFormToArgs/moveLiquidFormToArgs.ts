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
  DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP,
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

// NOTE(sa, 2020-08-11): leaving this as fn so it can be expanded later for dispense air gap
export function getAirGapData(
  hydratedFormData: HydratedMoveLiquidFormData,
  checkboxField: 'aspirate_airGap_checkbox' | 'dispense_airGap_checkbox',
  volumeField: 'aspirate_airGap_volume' | 'dispense_airGap_volume'
): number | null {
  const checkbox = hydratedFormData[checkboxField]
  const volume = hydratedFormData[volumeField]

  if (checkbox && typeof volume === 'number' && volume > 0) {
    return volume
  }

  return null
}
export function getMixData(
  hydratedFormData: any,
  checkboxField: any,
  volumeField: any,
  timesField: any
): InnerMixArgs | null | undefined {
  const checkbox = hydratedFormData[checkboxField]
  const volume = hydratedFormData[volumeField]
  const times = hydratedFormData[timesField]

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
  hydratedFormData: HydratedMoveLiquidFormData,
  contextualState: InvariantContext,
  path: PathOption
): PathOption => {
  const { pipette, tipRack, volume } = hydratedFormData
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
    hydratedFormData.liquidClass === NONE_LIQUID_CLASS_NAME ||
    hydratedFormData.liquidClass == null
      ? WATER_LIQUID_CLASS_NAME
      : hydratedFormData.liquidClass ?? null
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
          numDispenseWells: hydratedFormData.dispense_wells.length,
          conditioningByVolume: null,
          disposalByVolume: null,
        })
      : getTransferPlanAndReferenceVolumes({
          pipetteSpecs,
          tiprackDefinition: tiprackDef,
          volume,
          path,
          numDispenseWells: hydratedFormData.dispense_wells.length,
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
  hydratedFormData: HydratedMoveLiquidFormData,
  contextualState: InvariantContext
): MoveLiquidStepArgs => {
  console.assert(
    hydratedFormData.stepType === 'moveLiquid',
    `moveLiquidFormToArgs called with stepType ${hydratedFormData.stepType}, expected "moveLiquid"`
  )
  const pipetteId = hydratedFormData.pipette.id
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
    blowout_z_offset,
    pushOut_checkbox,
    pushOut_volume,
  } = hydratedFormData
  let sourceWells = getOrderedWells(
    hydratedFormData.aspirate_wells,
    sourceLabware.def,
    hydratedFormData.aspirate_wellOrder_first,
    hydratedFormData.aspirate_wellOrder_second
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
          hydratedFormData.dispense_wellOrder_first,
          hydratedFormData.dispense_wellOrder_second
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

  const disposalVolume = hydratedFormData.disposalVolume_checkbox
    ? hydratedFormData.disposalVolume_volume
    : null
  const touchTipAfterAspirate = Boolean(
    hydratedFormData.aspirate_touchTip_checkbox
  )
  const touchTipAfterAspirateOffsetMmFromTop =
    hydratedFormData.aspirate_touchTip_mmFromTop ??
    DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP
  const touchTipAfterAspirateSpeed =
    hydratedFormData.aspirate_touchTip_speed ?? null
  const touchTipAfterAspirateMmFromEdge =
    hydratedFormData.aspirate_touchTip_mmFromEdge ?? null
  const touchTipAfterDispense = Boolean(
    hydratedFormData.dispense_touchTip_checkbox
  )
  const touchTipAfterDispenseOffsetMmFromTop =
    hydratedFormData.dispense_touchTip_mmFromTop ??
    DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP
  const touchTipAfterDispenseSpeed =
    hydratedFormData.aspirate_touchTip_speed ?? null
  const touchTipAfterDispenseMmFromEdge =
    hydratedFormData.dispense_touchTip_mmFromEdge ?? null

  const mixBeforeAspirate = getMixData(
    hydratedFormData,
    'aspirate_mix_checkbox',
    'aspirate_mix_volume',
    'aspirate_mix_times'
  )
  const mixInDestination = getMixData(
    hydratedFormData,
    'dispense_mix_checkbox',
    'dispense_mix_volume',
    'dispense_mix_times'
  )
  const aspirateDelay = getMoveLiquidDelayData({
    hydratedFormData,
    secondsField: 'aspirate_delay_seconds',
    zPositionField: 'aspirate_mmFromBottom',
    checkboxField: 'aspirate_delay_checkbox',
  })
  const dispenseDelay = getMoveLiquidDelayData({
    hydratedFormData,
    secondsField: 'dispense_delay_seconds',
    zPositionField: 'dispense_mmFromBottom',
    checkboxField: 'dispense_delay_checkbox',
  })
  const aspirateSubmergeDelay = getMoveLiquidDelayData({
    hydratedFormData,
    secondsField: 'aspirate_submerge_delay_seconds',
    zPositionField: 'aspirate_submerge_mmFromBottom',
  })
  const dispenseSubmergeDelay = getMoveLiquidDelayData({
    hydratedFormData,
    secondsField: 'dispense_submerge_delay_seconds',
    zPositionField: 'dispense_submerge_mmFromBottom',
  })
  const aspirateRetractDelay = getMoveLiquidDelayData({
    hydratedFormData,
    secondsField: 'aspirate_retract_delay_seconds',
    zPositionField: 'aspirate_retract_mmFromBottom',
  })
  const dispenseRetractDelay = getMoveLiquidDelayData({
    hydratedFormData,
    secondsField: 'dispense_retract_delay_seconds',
    zPositionField: 'dispense_retract_mmFromBottom',
  })
  const blowoutLocation =
    (hydratedFormData.blowout_checkbox && hydratedFormData.blowout_location) ||
    (hydratedFormData.disposalVolume_checkbox &&
      path === 'multiDispense' &&
      hydratedFormData.disposalVolume_volume &&
      hydratedFormData.blowout_location) ||
    null

  const blowoutOffsetFromTopMm =
    blowoutLocation != null
      ? blowout_z_offset ?? DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP
      : DEFAULT_MM_BLOWOUT_OFFSET_FROM_TOP
  const aspirateAirGapVolume = getAirGapData(
    hydratedFormData,
    'aspirate_airGap_checkbox',
    'aspirate_airGap_volume'
  )
  const dispenseAirGapVolume = getAirGapData(
    hydratedFormData,
    'dispense_airGap_checkbox',
    'dispense_airGap_volume'
  )
  const matchingTipLiquidSpecs = getMatchingTipLiquidSpecs(
    hydratedFormData.pipette,
    hydratedFormData.volume,
    tipRack
  )
  const conditioningVolume =
    hydratedFormData.conditioning_checkbox === true &&
    hydratedFormData.conditioning_volume != null &&
    hydratedFormData.conditioning_volume > 0
      ? hydratedFormData.conditioning_volume
      : 0
  const commonFields = {
    pipette: pipetteId,
    volume,
    sourceLabware: sourceLabware.id,
    destLabware: destLabware.id,
    tipRack: tipRack,
    aspirateFlowRateUlSec:
      hydratedFormData.aspirate_flowRate ||
      matchingTipLiquidSpecs.defaultAspirateFlowRate.default,
    dispenseFlowRateUlSec:
      hydratedFormData.dispense_flowRate ||
      matchingTipLiquidSpecs.defaultDispenseFlowRate.default,
    aspirateOffsetFromBottomMm:
      hydratedFormData.aspirate_mmFromBottom || DEFAULT_MM_OFFSET_FROM_BOTTOM,
    dispenseOffsetFromBottomMm:
      hydratedFormData.dispense_mmFromBottom || DEFAULT_MM_OFFSET_FROM_BOTTOM,
    blowoutFlowRateUlSec:
      hydratedFormData.blowout_flowRate ||
      matchingTipLiquidSpecs.defaultBlowOutFlowRate.default,
    blowoutOffsetFromTopMm,
    changeTip: hydratedFormData.changeTip,
    preWetTip: Boolean(hydratedFormData.preWetTip),
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
    description: hydratedFormData.stepDetails,
    name: hydratedFormData.stepName,
    //  TODO(jr, 7/26/24): wire up wellNames
    dropTipLocation,
    nozzles,
    aspirateXOffset: aspirate_x_position ?? 0,
    aspirateYOffset: aspirate_y_position ?? 0,
    aspirateZOffset: hydratedFormData.aspirate_mmFromBottom ?? 0,
    aspiratePositionReference: hydratedFormData.aspirate_position_reference,
    dispenseXOffset: dispense_x_position ?? 0,
    dispenseYOffset: dispense_y_position ?? 0,
    dispenseZOffset: hydratedFormData.dispense_mmFromBottom ?? 0,
    dispensePositionReference: hydratedFormData.dispense_position_reference,
    aspirateSubmergeSpeed: hydratedFormData.aspirate_submerge_speed ?? null,
    aspirateSubmergeXOffset: hydratedFormData.aspirate_submerge_x_position ?? 0,
    aspirateSubmergeYOffset: hydratedFormData.aspirate_submerge_y_position ?? 0,
    aspirateSubmergeZOffset:
      hydratedFormData.aspirate_submerge_mmFromBottom ?? 0,
    aspirateSubmergePositionReference:
      hydratedFormData.aspirate_submerge_position_reference,
    aspirateRetractSpeed: hydratedFormData.aspirate_retract_speed ?? null,
    aspirateRetractXOffset: hydratedFormData.aspirate_retract_x_position ?? 0,
    aspirateRetractYOffset: hydratedFormData.aspirate_retract_y_position ?? 0,
    aspirateRetractZOffset: hydratedFormData.aspirate_retract_mmFromBottom ?? 0,
    aspirateRetractPositionReference:
      hydratedFormData.aspirate_retract_position_reference,
    dispenseSubmergeSpeed: hydratedFormData.dispense_submerge_speed ?? null,
    dispenseSubmergeXOffset: hydratedFormData.dispense_submerge_x_position ?? 0,
    dispenseSubmergeYOffset: hydratedFormData.dispense_submerge_y_position ?? 0,
    dispenseSubmergeZOffset:
      hydratedFormData.dispense_submerge_mmFromBottom ?? 0,
    dispenseSubmergePositionReference:
      hydratedFormData.dispense_submerge_position_reference,
    dispenseRetractSpeed: hydratedFormData.dispense_retract_speed ?? null,
    dispenseRetractYOffset: hydratedFormData.dispense_retract_y_position ?? 0,
    dispenseRetractZOffset: hydratedFormData.dispense_retract_mmFromBottom ?? 0,
    dispenseRetractPositionReference:
      hydratedFormData.dispense_position_reference,
    dispenseRetractXOffset: hydratedFormData.dispense_retract_x_position ?? 0,
    pushOut: pushOut_checkbox ? pushOut_volume : 0,
    liquidClass:
      hydratedFormData.liquidClass === NONE_LIQUID_CLASS_NAME // transform "none" (needed in step form) to null
        ? null
        : hydratedFormData.liquidClass ?? null,
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

  const checkedPath = getCheckedPath(hydratedFormData, contextualState, path)

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
        blowoutLocation: hydratedFormData.blowout_location,
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
