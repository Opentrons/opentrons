import {
  ETHANOL_LIQUID_CLASS_NAME,
  getAllLiquidClassDefs,
  getFlexNameConversion,
  getLabwareDefURI,
  GLYCEROL_LIQUID_CLASS_NAME,
  linearInterpolate,
  NONE_LIQUID_CLASS_NAME,
  POSITION_REFERENCE_TOP,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'

import { getTransferPlanAndReferenceVolumes } from './getTransferPlanAndReferenceVolumes'

import type {
  LiquidHandlingPropertyByVolume,
  // PositionReference,
  // Vector3D,
} from '@opentrons/shared-data'
import type { QuickTransferSummaryState } from '../types'

export const setLiquidClassValues = (
  state: QuickTransferSummaryState,
  liquidHandlingAction: 'aspirate' | 'dispense'
): QuickTransferSummaryState => {
  const { pipette } = state
  const convertedPipetteName = getFlexNameConversion(pipette)

  // const liquidClassDefaultValues: QuickTransferSummaryState = {}

  if (state.liquidClass.liquidClassName === NONE_LIQUID_CLASS_NAME) {
    // none getNoLiquidClassValues
    return getNoLiquidClassValues(
      state,
      convertedPipetteName,
      liquidHandlingAction
    )
  } else {
    // liquid class getLiquidClassValues
    return getLiquidClassValues(
      state,
      convertedPipetteName,
      liquidHandlingAction
    )
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

  const aspirateState = {
    aspirateFlowRate: aspirateFlowRateFields.aspirate_flowRate,
    tipPositionAspirate: aspirate.aspiratePosition.positionReference,
    submergeAspirate: {
      speed: aspirate.submerge.speed,
      positionFromBottom: POSITION_REFERENCE_TOP,
    },
    preWetTip: aspirate.preWet,
    mixOnAspirate: {
      mixVolume: aspirate.mix.params?.volume,
      repetitions: aspirate.mix.params?.repetitions,
    },
    delayAspirate: {
      delayDuration: aspirate.delay.params?.duration,
    },
    retractAspirate: {
      speed: aspirate.retract.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    },
    touchTipAspirate: aspirate.retract.touchTip.params?.mmFromEdge,
    touchTipAspirateSpeed: aspirate.retract.touchTip.params?.speed,
  }

  const dispenseState = {
    dispenseFlowRate: dispenseFlowRateFields.dispense_flowRate,
    tipPositionDispense: dispense.dispensePosition.positionReference,
    submergeDispense: {
      speed: dispense.submerge.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    },
    delayDispense: {
      delayDuration: dispense.delay.params?.duration,
    },
    pushOut: pushOutVolume != null && pushOutVolume > 0,
    retractDispense: {
      speed: dispense.retract.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    },
    blowOutDispense: {
      location: singleDispense.retract.blowout?.params?.location ?? null,
      flowRate: singleDispense.retract.blowout?.params?.flowRate ?? 1,
    },
    touchTipDispense: dispense.retract.touchTip.params?.mmFromEdge,
    touchTipDispenseSpeed: dispense.retract.touchTip.params?.speed,
  }
  if (liquidHandlingAction === 'aspirate') {
    return {
      ...state,
      ...aspirateState,
    }
  } else {
    return {
      ...state,
      ...dispenseState,
    }
  }
}

const getFlowRateFields = (
  volume: number,
  flowRateByVolume: LiquidHandlingPropertyByVolume,
  liquidHandlingAction: 'aspirate' | 'dispense'
): Record<string, number | null> => {
  const interpolatedFlowRate = linearInterpolate(
    volume,
    flowRateByVolume as Array<[number, number]>
  )
  return {
    [`${liquidHandlingAction}_flowRate`]: interpolatedFlowRate,
  }
}

// const getOffsetFields = (
//   offset: Vector3D,
//   prefix: string
// ): Record<string, number> => {
//   return {
//     [`${prefix}_x_position`]: offset.x,
//     [`${prefix}_y_position`]: offset.y,
//     [`${prefix}_mmFromBottom`]: offset.z,
//   }
// }

// const getPositionReferenceFields = (
//   positionReference: PositionReference,
//   prefix: string
// ): Record<string, PositionReference> => {
//   return {
//     [`${prefix}_position_reference`]: positionReference,
//   }
// }

/**
 * getLiquidClassValues
 * this function returns the values of liquid class
 */

const getLiquidClassValues = (
  state: QuickTransferSummaryState,
  convertedPipetteName: string,
  liquidHandlingAction: 'aspirate' | 'dispense'
): QuickTransferSummaryState => {
  const {
    tipRack,
    path,
    pipette: pipetteSpecs,
    volume,
    destinationWells,
    // delayAspirate,
    // delayDispense,
  } = state

  const allLiquidClassDefs = getAllLiquidClassDefs()
  const liquidClassMap = new Map<string, string>([
    ['water', WATER_LIQUID_CLASS_NAME],
    ['glycerol_50', GLYCEROL_LIQUID_CLASS_NAME],
    ['ethanol_80', ETHANOL_LIQUID_CLASS_NAME],
  ])
  const selectedLiquidClass = liquidClassMap.get(
    state.liquidClass?.liquidClassName ?? 'none'
  )
  const liquidClassDef =
    allLiquidClassDefs[selectedLiquidClass ?? NONE_LIQUID_CLASS_NAME]

  const { loadName: currentTiprackLoadName } = state.tipRack.parameters
  const tipTypeSettings = liquidClassDef?.byPipette
    ?.find(({ pipetteModel }) => convertedPipetteName === pipetteModel)
    ?.byTipType.find(tipObject => {
      const tiprackLoadName = tipObject.tiprack.split('/')[1]
      return tiprackLoadName === currentTiprackLoadName
    })

  // const dispenseType =
  //   state.path === 'multiDispense' ? 'multiDispense' : 'singleDispense'
  // const liquidHandlingType =
  //   liquidHandlingAction === 'aspirate' ? 'aspirate' : dispenseType

  // const liquidClassValues = tipTypeSettings?.[liquidHandlingType]

  // if (liquidClassValues == null) {
  //   return state
  // }

  const { aspirate, singleDispense, multiDispense } = tipTypeSettings ?? {}

  const dispense =
    multiDispense != null && path === 'multiDispense'
      ? multiDispense
      : singleDispense

  const {
    conditioningByVolume: rawConditioningByVolume = [],
    disposalByVolume: rawDisposalByVolume = [],
  } = multiDispense ?? {}
  const conditioningByVolume = rawConditioningByVolume as Array<
    [number, number]
  >
  const disposalByVolume = rawDisposalByVolume as Array<[number, number]>
  const maxWorkingVolumeTip = tipRack.wells.A1.totalLiquidVolume
  const aspirateAirGapByVolume = aspirate?.retract.airGapByVolume as Array<
    [number, number]
  >
  const numDispenseWells = destinationWells.length
  const byVolumeLookup = getTransferPlanAndReferenceVolumes({
    pipetteSpecs,
    maxWorkingVolumeTip,
    volume,
    path,
    numDispenseWells,
    aspirateAirGapByVolume,
    conditioningByVolume,
    disposalByVolume,
  }).referenceVolumes

  const { pushOut, airGap, flowRate, conditioning, disposal } = byVolumeLookup

  const aspirateState = {
    aspirateFlowRate: flowRate.aspirate,
    tipPositionAspirate: aspirate?.aspiratePosition.positionReference,
    submergeAspirate: {
      speed: aspirate?.submerge.speed,
      positionFromBottom: POSITION_REFERENCE_TOP,
    },
    preWetTip: aspirate?.preWet,
    mixOnAspirate: {
      mixVolume: aspirate?.mix.params?.volume,
      repetitions: aspirate?.mix.params?.repetitions,
    },
    delayAspirate: {
      delayDuration: aspirate?.delay.params?.duration,
    },
    retractAspirate: {
      speed: aspirate?.retract.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    },
    touchTipAspirate: aspirate?.retract.touchTip.params?.mmFromEdge,
    touchTipAspirateSpeed: aspirate?.retract.touchTip.params?.speed,
    airGapAspirate: airGap.aspirate,
    conditionAspirate: conditioning ?? 0,
  }

  const dispenseState = {
    dispenseFlowRate: flowRate.dispense,
    tipPositionDispense: dispense?.dispensePosition.positionReference,
    submergeDispense: {
      speed: dispense?.submerge.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    },
    delayDispense: {
      delayDuration: dispense?.delay.params?.duration,
    },
    pushOut: pushOut > 0,
    retractDispense: {
      speed: dispense?.retract.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    },
    // ToDo will be updated when the blowout pr is merged
    blowOut: singleDispense?.retract.blowout?.params?.location ?? null,
    touchTipDispense: dispense?.retract.touchTip.params?.mmFromEdge,
    touchTipDispenseSpeed: dispense?.retract.touchTip.params?.speed,
    airGapDispense: airGap.dispense,
    disposalVolumeDispenseSettings: {
      volume: disposal,
      blowOutLocation:
        singleDispense?.retract.blowout?.params?.location ?? null,
      flowRate: flowRate.dispense,
    },
  }

  if (liquidHandlingAction === 'aspirate') {
    return {
      ...state,
      ...aspirateState,
    }
  } else {
    return {
      ...state,
      ...dispenseState,
    }
  }
}
