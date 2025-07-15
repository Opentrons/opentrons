import {
  ETHANOL_LIQUID_CLASS_NAME,
  getAllLiquidClassDefs,
  getFlexNameConversion,
  getLabwareDefURI,
  GLYCEROL_LIQUID_CLASS_NAME,
  linearInterpolate,
  NONE_LIQUID_CLASS_NAME,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import { getTransferPlanAndReferenceVolumes } from './getTransferPlanAndReferenceVolumes'

import type { LiquidHandlingPropertyByVolume } from '@opentrons/shared-data'
import type { BlowOutLocation, QuickTransferSummaryState } from '../types'

export const retrieveLiquidClassValues = (
  state: QuickTransferSummaryState,
  liquidHandlingAction: 'aspirate' | 'dispense' | 'all'
): QuickTransferSummaryState => {
  const { pipette } = state
  const convertedPipetteName = getFlexNameConversion(pipette)

  if (state.liquidClass.liquidClassName === NONE_LIQUID_CLASS_NAME) {
    return getNoLiquidClassValues(
      state,
      convertedPipetteName,
      liquidHandlingAction
    )
  } else {
    return getLiquidClassValues(
      state,
      convertedPipetteName,
      liquidHandlingAction
    )
  }
}

const convertBlowoutLocation = (
  location: string | undefined,
  state: QuickTransferSummaryState
): BlowOutLocation | undefined => {
  if (location == null) return undefined

  switch (location) {
    case 'source':
      return SOURCE_WELL_BLOWOUT_DESTINATION
    case 'destination':
      return DEST_WELL_BLOWOUT_DESTINATION
    case 'trash':
      return state.dropTipLocation
    default:
      return undefined
  }
}

/**
 * getNoLiquidClassValues
 * this function returns the values of none liquid class
 * @returns QuickTransferSummaryState
 */
const getNoLiquidClassValues = (
  state: QuickTransferSummaryState,
  convertedPipetteName: string,
  liquidHandlingAction: 'aspirate' | 'dispense' | 'all'
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
    aspirateFlowRate: aspirateFlowRateFields.aspirate_flowRate ?? 0,
    tipPositionAspirate: aspirate.aspiratePosition.offset.z,
    submergeAspirate: {
      speed: aspirate.submerge.speed,
      positionFromBottom: aspirate.submerge.startPosition.offset.z,
    },
    preWetTip: aspirate.preWet,
    mixOnAspirate: {
      mixVolume: aspirate.mix.params?.volume ?? 0,
      repetitions: aspirate.mix.params?.repetitions ?? 0,
    },
    delayAspirate: {
      delayDuration: aspirate.delay.params?.duration ?? 0,
    },
    retractAspirate: {
      speed: aspirate.retract.speed ?? 0,
      positionFromBottom: aspirate.retract.endPosition.offset.z ?? 0,
    },
    touchTipAspirate: aspirate.retract.touchTip.params?.zOffset,
    touchTipAspirateSpeed: aspirate.retract.touchTip.params?.speed,
  }

  const dispenseState = {
    dispenseFlowRate: dispenseFlowRateFields.dispense_flowRate ?? 0,
    tipPositionDispense: dispense.dispensePosition.offset.z,
    submergeDispense: {
      speed: dispense.submerge.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    },
    delayDispense: !dispense.delay.enable
      ? undefined
      : {
          delayDuration: dispense.delay.params?.duration ?? 0,
        },
    pushOut: pushOutVolume != null && pushOutVolume > 0,
    retractDispense: {
      speed: dispense.retract.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
    },
    blowOutDispense: {
      location: convertBlowoutLocation(
        dispense.retract.blowout?.params?.location,
        state
      ),
      flowRate: dispense.retract.blowout?.params?.flowRate ?? 0,
    },
    touchTipDispense: dispense.retract.touchTip.params?.zOffset,
    touchTipDispenseSpeed: dispense.retract.touchTip.params?.speed,
  }

  if (liquidHandlingAction === 'all') {
    return {
      ...state,
      ...aspirateState,
      ...dispenseState,
    }
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
  liquidHandlingAction: 'aspirate' | 'dispense' | 'all'
): Record<string, number | null> => {
  const interpolatedFlowRate = linearInterpolate(
    volume,
    flowRateByVolume as Array<[number, number]>
  )
  return {
    [`${liquidHandlingAction}_flowRate`]: interpolatedFlowRate,
  }
}

/**
 * getLiquidClassValues
 * this function returns the values of liquid class
 */

const getLiquidClassValues = (
  state: QuickTransferSummaryState,
  convertedPipetteName: string,
  liquidHandlingAction: 'aspirate' | 'dispense' | 'all'
): QuickTransferSummaryState => {
  const {
    tipRack,
    path,
    pipette: pipetteSpecs,
    volume,
    destinationWells,
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
    tipPositionAspirate: aspirate?.aspiratePosition.offset.z ?? 0,
    submergeAspirate: {
      speed: aspirate?.submerge.speed ?? 0,
      positionFromBottom: aspirate?.submerge.startPosition.offset.z ?? 0,
    },
    preWetTip: aspirate?.preWet ?? false,
    mixOnAspirate:
      aspirate?.mix.enable === false
        ? undefined
        : {
            mixVolume: aspirate?.mix.params?.volume ?? 0,
            repetitions: aspirate?.mix.params?.repetitions ?? 0,
          },
    delayAspirate:
      aspirate?.delay.enable === false
        ? undefined
        : {
            delayDuration: aspirate?.delay.params?.duration ?? 0,
          },
    retractAspirate: {
      speed: aspirate?.retract.speed ?? 0,
      positionFromBottom: aspirate?.retract.endPosition.offset.z ?? 0,
    },
    touchTipAspirate:
      aspirate?.retract.touchTip.enable === false
        ? undefined
        : aspirate?.retract.touchTip.params?.zOffset,
    touchTipAspirateSpeed:
      aspirate?.retract.touchTip.enable === false
        ? undefined
        : aspirate?.retract.touchTip.params?.speed,
    airGapAspirate: airGap.aspirate,
    conditionAspirate: conditioning ?? 0,
  }

  const dispenseState = {
    dispenseFlowRate: flowRate.dispense,
    tipPositionDispense: dispense?.dispensePosition.offset.z ?? 0,
    submergeDispense: {
      speed: dispense?.submerge.speed ?? 0,
      positionFromBottom: dispense?.submerge.startPosition.offset.z ?? 0,
    },
    delayDispense:
      dispense?.delay.enable === false
        ? undefined
        : {
            delayDuration: dispense?.delay.params?.duration ?? 0,
          },
    mixOnDispense:
      path === 'multiDispense' || singleDispense?.mix?.enable === false
        ? undefined
        : {
            mixVolume: singleDispense?.mix?.params?.volume ?? 0,
            repetitions: singleDispense?.mix?.params?.repetitions ?? 0,
          },
    pushOut: pushOut > 0,
    retractDispense: {
      speed: dispense?.retract.speed ?? 0,
      positionFromBottom: dispense?.retract.endPosition.offset.z ?? 0,
    },
    blowOutDispense:
      dispense?.retract.blowout?.enable === false
        ? undefined
        : {
            location: convertBlowoutLocation(
              dispense?.retract.blowout?.params?.location,
              state
            ),
            flowRate: dispense?.retract.blowout?.params?.flowRate ?? 0,
          },
    touchTipDispense:
      dispense?.retract.touchTip.enable === false
        ? undefined
        : dispense?.retract.touchTip.params?.zOffset,
    touchTipDispenseSpeed:
      dispense?.retract.touchTip.enable === false
        ? undefined
        : dispense?.retract.touchTip.params?.speed,
    airGapDispense: airGap.dispense,
    disposalVolumeDispenseSettings: {
      volume: disposal ?? 0,
      blowOutLocation:
        convertBlowoutLocation(
          dispense?.retract.blowout?.params?.location,
          state
        ) ?? state.dropTipLocation,

      flowRate: flowRate.dispense,
    },
  }

  if (liquidHandlingAction === 'all') {
    return {
      ...state,
      ...aspirateState,
      ...dispenseState,
    }
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
