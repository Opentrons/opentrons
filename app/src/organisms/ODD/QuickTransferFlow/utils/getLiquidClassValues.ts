import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  getLabwareDefURI,
  linearInterpolate,
  POSITION_REFERENCE_TOP,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'

import type {
  PipetteV2Specs,
  PositionReference,
  Vector3D,
} from '@opentrons/shared-data'
import type { QuickTransferSummaryState } from '../types'

export const setLiquidClassValues = (
  state: QuickTransferSummaryState,
  liquidHandlingAction: 'aspirate' | 'dispense'
): QuickTransferSummaryState => {
  const { pipette } = state
  const convertedPipetteName = getFlexNameConversion(pipette)

  // const liquidClassDefaultValues: QuickTransferSummaryState = {}

  if (state.liquidClass.liquidClassName === 'none') {
    // none getNoLiquidClassValues
    return getNoLiquidClassValues(
      state,
      convertedPipetteName,
      liquidHandlingAction
    )
  } else {
    // liquid class getLiquidClassValues
  }

  // return liquidClassDefaultValues
}

/**
 * getNoLiquidClassValues
 * this function returns the values of none liquid class
 * @returns QuickTransferSummaryState
 */
const getNoLiquidClassValues = (
  state: QuickTransferSummaryState,
  convertedPipetteName: string,
  liquidHandlingAction: 'aspirate' | 'dispense'
): QuickTransferSummaryState => {
  const { tipRack, path, volume } = state
  const tiprackDefinition = getLabwareDefURI(tipRack)
  const referenceLiquidClass = getAllLiquidClassDefs()[WATER_LIQUID_CLASS_NAME]
  const liquidClassValuesForPipette = referenceLiquidClass.byPipette.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = liquidClassValuesForPipette?.byTipType.find(
    tipObject => tipObject.tiprack === tiprackDefinition
  )
  if (liquidClassValuesForTip == null) {
    return state
  }
  const { aspirate, singleDispense, multiDispense } = liquidClassValuesForTip
  const dispense =
    multiDispense != null && path === 'multiDispense'
      ? multiDispense
      : singleDispense

  const aspirateFlowRateFields = getFlowRateFields(
    volume,
    aspirate.flowRateByVolume,
    'aspirate'
  )
  const dispenseFlowRateFields = getFlowRateFields(
    volume,
    dispense.flowRateByVolume,
    'dispense'
  )

  const pushOutVolume = linearInterpolate(
    volume,
    (singleDispense.pushOutByVolume as Array<[number, number]>) ?? 0
  )

  const aspirateOffsetFields = getOffsetFields(
    aspirate.aspiratePosition.offset,
    'aspirate'
  )
  const dispenseOffsetFields = getOffsetFields(
    dispense.dispensePosition.offset,
    'dispense'
  )

  const aspiratePositionReferenceFields = getPositionReferenceFields(
    aspirate.aspiratePosition.positionReference,
    'aspirate'
  )
  const dispensePositionReferenceFields = getPositionReferenceFields(
    dispense.dispensePosition.positionReference,
    'dispense'
  )

  const aspirateFields = {
    ...aspirateFlowRateFields,
    ...aspirateOffsetFields,
    ...aspiratePositionReferenceFields,
    aspirate_submerge_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    aspirate_submerge_position_reference: POSITION_REFERENCE_TOP,
    aspirate_submerge_x_position: 0,
    aspirate_submerge_y_position: 0,
    aspirate_submerge_speed: aspirate.submerge.speed,
    aspirate_retract_speed: aspirate.retract.speed,
    aspirate_retract_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    aspirate_retract_position_reference: POSITION_REFERENCE_TOP,
    aspirate_retract_x_position: 0,
    aspirate_retract_y_position: 0,
    aspirate_touchTip_speed: aspirate.retract.touchTip.params?.speed,
    aspirate_touchTip_mmFromEdge: aspirate.retract.touchTip.params?.mmFromEdge,
    aspirate_touchTip_mmFromTop: aspirate.retract.touchTip.params?.zOffset,
  }

  const dispenseFields = {
    ...dispenseFlowRateFields,
    ...dispenseOffsetFields,
    ...dispensePositionReferenceFields,
    dispense_submerge_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    dispense_submerge_position_reference: POSITION_REFERENCE_TOP,
    dispense_submerge_x_position: 0,
    dispense_submerge_y_position: 0,
    dispense_submerge_speed: dispense.submerge.speed,
    dispense_retract_speed: dispense.retract.speed,
    dispense_retract_mmFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    dispense_retract_position_reference: POSITION_REFERENCE_TOP,
    dispense_retract_x_position: 0,
    dispense_retract_y_position: 0,
    pushOut_checkbox: pushOutVolume > 0,
    pushOut_volume: pushOutVolume,
    dispense_touchTip_speed: dispense.retract.touchTip.params?.speed,
    dispense_touchTip_mmFromEdge: dispense.retract.touchTip.params?.mmFromEdge,
    dispense_touchTip_mmFromTop: dispense.retract.touchTip.params?.zOffset,
  }
  if (liquidHandlingAction === 'aspirate') {
    return {
      ...state,
      ...aspirateFields,
    }
  } else {
    return {
      ...state,
      ...dispenseFields,
    }
  }
}

const getFlowRateFields = (
  volume: number,
  flowRateByVolume: LiquidHandlingPropertyByVolume,
  liquidHandlingAction: LiquidHandlingTab
): Record<string, number | null> => {
  const interpolatedFlowRate = linearInterpolate(
    volume,
    flowRateByVolume as Array<[number, number]>
  )
  return {
    [`${liquidHandlingAction}_flowRate`]: interpolatedFlowRate,
  }
}

const getOffsetFields = (
  offset: Vector3D,
  prefix: string
): Record<string, number> => {
  return {
    [`${prefix}_x_position`]: offset.x,
    [`${prefix}_y_position`]: offset.y,
    [`${prefix}_mmFromBottom`]: offset.z,
  }
}

const getPositionReferenceFields = (
  positionReference: PositionReference,
  prefix: string
): Record<string, PositionReference> => {
  return {
    [`${prefix}_position_reference`]: positionReference,
  }
}

/**
 * getLiquidClassValues
 * this function returns the values of liquid class
 */
const getLiquidClassValues = (
  state: QuickTransferSummaryState,
  convertedPipetteName: string,
  liquidHandlingAction: 'aspirate' | 'dispense',
  pipetteSpecs: PipetteV2Specs
): QuickTransferSummaryState => {}
