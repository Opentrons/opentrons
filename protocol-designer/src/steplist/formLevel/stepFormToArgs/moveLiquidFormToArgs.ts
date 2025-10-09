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
  formData: GetCastFormData<HydratedMoveLiquidFormData>,
  checkboxField: 'aspirate_airGap_checkbox' | 'dispense_airGap_checkbox',
  volumeField: 'aspirate_airGap_volume' | 'dispense_airGap_volume'
): number | null {
  const checkbox = formData[checkboxField]
  const volume = formData[volumeField]

  if (checkbox && typeof volume === 'number' && volume > 0) {
    return volume
  }

  return null
}
export function getMixData(
  formData: GetCastFormData<HydratedMoveLiquidFormData>,
  checkboxField: 'aspirate_mix_checkbox' | 'dispense_mix_checkbox',
  volumeField: 'aspirate_mix_volume' | 'dispense_mix_volume',
  timesField: 'aspirate_mix_times' | 'dispense_mix_times'
): InnerMixArgs | null | undefined {
  const checkbox = formData[checkboxField]
  const volume = formData[volumeField]
  const times = formData[timesField]

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
  formData: GetCastFormData<HydratedMoveLiquidFormData>,
  contextualState: InvariantContext,
  path: PathOption
): PathOption => {
  const { pipette, tipRack, volume } = formData
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
    formData.liquidClass === NONE_LIQUID_CLASS_NAME ||
    formData.liquidClass == null
      ? WATER_LIQUID_CLASS_NAME
      : formData.liquidClass ?? null
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
          numAspirateWells: formData.aspirate_wells.length,
          numDispenseWells: formData.dispense_wells.length,
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
          numAspirateWells: formData.aspirate_wells.length,
          numDispenseWells: formData.dispense_wells.length,
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
  formData: GetCastFormData<HydratedMoveLiquidFormData>,
  contextualState: InvariantContext
): MoveLiquidStepArgs => {
  console.assert(
    formData.stepType === 'moveLiquid',
    `moveLiquidFormToArgs called with stepType ${formData.stepType}, expected "moveLiquid"`
  )
  const pipetteId = formData.pipette.id
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
  } = formData
  let sourceWells = getOrderedWells(
    formData.aspirate_wells,
    sourceLabware.def,
    formData.aspirate_wellOrder_first,
    formData.aspirate_wellOrder_second
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
          formData.dispense_wellOrder_first,
          formData.dispense_wellOrder_second
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

  const disposalVolume = formData.disposalVolume_checkbox
    ? formData.disposalVolume_volume
    : null
  const touchTipAfterAspirate = Boolean(formData.aspirate_touchTip_checkbox)
  const touchTipAfterAspirateOffsetMmFromTop =
    formData.aspirate_touchTip_mmFromTop ?? DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP
  const touchTipAfterAspirateSpeed = formData.aspirate_touchTip_speed ?? null
  const touchTipAfterAspirateMmFromEdge =
    formData.aspirate_touchTip_mmFromEdge ?? null
  const touchTipAfterDispense = Boolean(formData.dispense_touchTip_checkbox)
  const touchTipAfterDispenseOffsetMmFromTop =
    formData.dispense_touchTip_mmFromTop ?? DEFAULT_MM_TOUCH_TIP_OFFSET_FROM_TOP
  const touchTipAfterDispenseSpeed = formData.dispense_touchTip_speed ?? null
  const touchTipAfterDispenseMmFromEdge =
    formData.dispense_touchTip_mmFromEdge ?? null

  const mixBeforeAspirate = getMixData(
    formData,
    'aspirate_mix_checkbox',
    'aspirate_mix_volume',
    'aspirate_mix_times'
  )
  const mixInDestination = getMixData(
    formData,
    'dispense_mix_checkbox',
    'dispense_mix_volume',
    'dispense_mix_times'
  )
  const aspirateDelay = getMoveLiquidDelayData({
    formData,
    secondsField: 'aspirate_delay_seconds',
    checkboxField: 'aspirate_delay_checkbox',
  })
  const dispenseDelay = getMoveLiquidDelayData({
    formData,
    secondsField: 'dispense_delay_seconds',
    checkboxField: 'dispense_delay_checkbox',
  })
  const aspirateSubmergeDelay = getMoveLiquidDelayData({
    formData,
    secondsField: 'aspirate_submerge_delay_seconds',
  })
  const dispenseSubmergeDelay = getMoveLiquidDelayData({
    formData,
    secondsField: 'dispense_submerge_delay_seconds',
  })
  const aspirateRetractDelay = getMoveLiquidDelayData({
    formData,
    secondsField: 'aspirate_retract_delay_seconds',
  })
  const dispenseRetractDelay = getMoveLiquidDelayData({
    formData,
    secondsField: 'dispense_retract_delay_seconds',
  })
  const blowoutLocation =
    (formData.blowout_checkbox && formData.blowout_location) ||
    (formData.disposalVolume_checkbox &&
      path === 'multiDispense' &&
      formData.disposalVolume_volume &&
      formData.blowout_location) ||
    null

  const aspirateAirGapVolume = getAirGapData(
    formData,
    'aspirate_airGap_checkbox',
    'aspirate_airGap_volume'
  )
  const dispenseAirGapVolume = getAirGapData(
    formData,
    'dispense_airGap_checkbox',
    'dispense_airGap_volume'
  )
  const matchingTipLiquidSpecs = getMatchingTipLiquidSpecs(
    formData.pipette,
    formData.volume,
    tipRack
  )
  const conditioningVolume =
    formData.conditioning_checkbox === true &&
    formData.conditioning_volume != null &&
    formData.conditioning_volume > 0
      ? formData.conditioning_volume
      : 0

  const commonFields = {
    pipette: pipetteId,
    volume,
    sourceLabware: sourceLabware.id,
    destLabware: destLabware.id,
    tipRack,
    aspirateFlowRateUlSec:
      formData.aspirate_flowRate ||
      matchingTipLiquidSpecs.defaultAspirateFlowRate.default,
    dispenseFlowRateUlSec:
      formData.dispense_flowRate ||
      matchingTipLiquidSpecs.defaultDispenseFlowRate.default,
    aspirateOffsetFromBottomMm:
      formData.aspirate_mmFromBottom || DEFAULT_MM_OFFSET_FROM_BOTTOM,
    dispenseOffsetFromBottomMm:
      formData.dispense_mmFromBottom || DEFAULT_MM_OFFSET_FROM_BOTTOM,
    blowoutFlowRateUlSec:
      formData.blowout_flowRate ||
      matchingTipLiquidSpecs.defaultBlowOutFlowRate.default,
    changeTip: formData.changeTip,
    preWetTip: Boolean(formData.preWetTip),
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
    description: formData.stepDetails,
    name: formData.stepName,
    //  TODO(jr, 7/26/24): wire up wellNames
    dropTipLocation,
    nozzles,
    aspirateXOffset: aspirate_x_position ?? 0,
    aspirateYOffset: aspirate_y_position ?? 0,
    aspirateZOffset:
      formData.aspirate_mmFromBottom ?? DEFAULT_MM_OFFSET_FROM_BOTTOM,
    aspiratePositionReference: formData.aspirate_position_reference,
    dispenseXOffset: dispense_x_position ?? 0,
    dispenseYOffset: dispense_y_position ?? 0,
    dispenseZOffset:
      formData.dispense_mmFromBottom ?? DEFAULT_MM_OFFSET_FROM_BOTTOM,
    dispensePositionReference: formData.dispense_position_reference,
    aspirateSubmergeSpeed: formData.aspirate_submerge_speed ?? null,
    aspirateSubmergeXOffset: formData.aspirate_submerge_x_position ?? 0,
    aspirateSubmergeYOffset: formData.aspirate_submerge_y_position ?? 0,
    aspirateSubmergeZOffset: formData.aspirate_submerge_mmFromBottom ?? 0,
    aspirateSubmergePositionReference:
      formData.aspirate_submerge_position_reference,
    aspirateRetractSpeed: formData.aspirate_retract_speed ?? null,
    aspirateRetractXOffset: formData.aspirate_retract_x_position ?? 0,
    aspirateRetractYOffset: formData.aspirate_retract_y_position ?? 0,
    aspirateRetractZOffset: formData.aspirate_retract_mmFromBottom ?? 0,
    aspirateRetractPositionReference:
      formData.aspirate_retract_position_reference,
    dispenseSubmergeSpeed: formData.dispense_submerge_speed ?? null,
    dispenseSubmergeXOffset: formData.dispense_submerge_x_position ?? 0,
    dispenseSubmergeYOffset: formData.dispense_submerge_y_position ?? 0,
    dispenseSubmergeZOffset: formData.dispense_submerge_mmFromBottom ?? 0,
    dispenseSubmergePositionReference:
      formData.dispense_submerge_position_reference,
    dispenseRetractSpeed: formData.dispense_retract_speed ?? null,
    dispenseRetractYOffset: formData.dispense_retract_y_position ?? 0,
    dispenseRetractZOffset: formData.dispense_retract_mmFromBottom ?? 0,
    dispenseRetractPositionReference:
      formData.dispense_retract_position_reference,
    dispenseRetractXOffset: formData.dispense_retract_x_position ?? 0,
    pushOut: pushOut_checkbox ? pushOut_volume : 0,
    liquidClass:
      formData.liquidClass === NONE_LIQUID_CLASS_NAME // transform "none" (needed in step form) to null
        ? null
        : formData.liquidClass ?? null,
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

  const checkedPath = getCheckedPath(formData, contextualState, path)

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
