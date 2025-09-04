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
  getLiquidClassName,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import { getFlowRateFields } from './getFlowRaiteFields'
import { getMatchingTipLiquidSpecsFromSpec } from './getMatchingTipLiquidSpecsFromSpec'
import { getMaxUiFlowRate } from './getMaxUiFlowRate'
import { getTransferPlanAndReferenceVolumes } from './getTransferPlanAndReferenceVolumes'

import type { BlowOutLocation, QuickTransferSummaryState } from '../types'

export const retrieveLiquidClassValues = (
  state: QuickTransferSummaryState,
  liquidHandlingAction: 'aspirate' | 'dispense' | 'all'
): QuickTransferSummaryState => {
  const { pipette } = state
  const convertedPipetteName = getFlexNameConversion(pipette)

  if (state.liquidClassName === NONE_LIQUID_CLASS_NAME) {
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
  const { tipRack, path, volume, pipette } = state
  const tiprackUri = getLabwareDefURI(tipRack)
  const referenceLiquidClass = getAllLiquidClassDefs()[WATER_LIQUID_CLASS_NAME]
  const liquidClassValuesForPipette = referenceLiquidClass.byPipette.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = liquidClassValuesForPipette?.byTipType.find(
    tipObject => tipObject.tiprack === tiprackUri
  )
  if (liquidClassValuesForTip == null) {
    return state
  }
  const { aspirate, singleDispense, multiDispense } = liquidClassValuesForTip
  const dispense =
    multiDispense != null && path === 'multiDispense'
      ? multiDispense
      : singleDispense

  const pushOutVolume = linearInterpolate(
    volume,
    (singleDispense.pushOutByVolume as Array<[number, number]>) ?? 0
  )

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
  const numDispenseWells = state.destinationWells.length
  const byVolumeLookup = getTransferPlanAndReferenceVolumes({
    pipetteSpecs: pipette,
    maxWorkingVolumeTip,
    volume,
    path,
    numDispenseWells,
    aspirateAirGapByVolume,
    conditioningByVolume,
    disposalByVolume,
  }).referenceVolumes

  const { airGap, conditioning, correction, flowRate } = byVolumeLookup

  const aspirateCorrectionVolume = linearInterpolate(
    correction.aspirate,
    aspirate.correctionByVolume as Array<[number, number]>
  )
  const dispenseCorrectionVolume = linearInterpolate(
    correction.dispense,
    dispense.correctionByVolume as Array<[number, number]>
  )

  const matchingTipLiquidSpecs = getMatchingTipLiquidSpecsFromSpec(
    pipette,
    volume,
    tiprackUri as string
  )

  const aspirateMaxUiFlowRate = getMaxUiFlowRate({
    targetVolume: flowRate.aspirate,
    channels: pipette.channels,
    tipLiquidSpecs: matchingTipLiquidSpecs,
    flowRateType: 'aspirate',
    correctionVolume: aspirateCorrectionVolume ?? 0,
    shaftULperMM: pipette.shaftULperMM,
  })

  const dispenseMaxUiFlowRate = getMaxUiFlowRate({
    targetVolume: flowRate.dispense,
    channels: pipette.channels,
    tipLiquidSpecs: matchingTipLiquidSpecs,
    flowRateType: 'dispense',
    correctionVolume: dispenseCorrectionVolume ?? 0,
    shaftULperMM: pipette.shaftULperMM,
  })

  const aspirateFlowRateFields = getFlowRateFields(
    volume,
    aspirate.flowRateByVolume,
    'aspirate',
    aspirateMaxUiFlowRate
  )

  const dispenseFlowRateFields = getFlowRateFields(
    volume,
    dispense.flowRateByVolume,
    'dispense',
    dispenseMaxUiFlowRate
  )

  const aspirateState = {
    aspirateFlowRate: aspirateFlowRateFields.aspirate_flowRate ?? 0,
    tipPositionAspirate: aspirate.aspiratePosition.offset.z,
    submergeAspirate: {
      speed: aspirate.submerge.speed,
      positionFromBottom: aspirate.submerge.startPosition.offset.z,
      delayDuration: aspirate.submerge.delay.params?.duration ?? 0,
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
      delayDuration: aspirate.retract.delay.params?.duration ?? 0,
    },
    touchTipAspirate: !aspirate.retract.touchTip.enable
      ? undefined
      : aspirate.retract.touchTip.params?.zOffset,
    touchTipAspirateSpeed: aspirate.retract.touchTip.params?.speed,
    airGapAspirate: aspirate.retract.airGapByVolume[0][1] ?? 0,
    conditionAspirate: conditioning ?? 0,
  }

  const dispenseState = {
    dispenseFlowRate: dispenseFlowRateFields.dispense_flowRate ?? 0,
    tipPositionDispense: dispense.dispensePosition.offset.z,
    submergeDispense: {
      speed: dispense.submerge.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      delayDuration: dispense.submerge.delay.params?.duration ?? 0,
    },
    delayDispense: !dispense.delay.enable
      ? undefined
      : {
          delayDuration: dispense.delay.params?.duration ?? 0,
        },
    pushOutDispense: {
      volume:
        linearInterpolate(
          volume,
          singleDispense?.pushOutByVolume as Array<[number, number]>
        ) ?? 0,
    },
    retractDispense: {
      speed: dispense.retract.speed,
      positionFromBottom: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      delayDuration: dispense.retract.delay.params?.duration ?? 0,
    },
    blowOutDispense: {
      location: convertBlowoutLocation(
        dispense.retract.blowout?.params?.location,
        state
      ),
      flowRate: dispense.retract.blowout?.params?.flowRate ?? 0,
    },
    touchTipDispense: !dispense.retract.touchTip.enable
      ? undefined
      : dispense.retract.touchTip.params?.zOffset,
    touchTipDispenseSpeed: dispense.retract.touchTip.params?.speed,
    airGapDispense: dispense.retract.airGapByVolume[0][1] ?? 0,
    disposalVolumeDispenseSettings: {
      volume: pipette.liquids.default.minVolume,
      blowOutLocation:
        convertBlowoutLocation(
          dispense?.retract.blowout?.params?.location,
          state
        ) ?? state.dropTipLocation,
      flowRate: dispenseFlowRateFields.dispense_flowRate ?? 0,
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
    getLiquidClassName(state.liquidClassName) ?? 'none'
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

  const {
    flowRateByVolume: aspirateFlowRateByVolume,
    aspiratePosition,
    preWet,
    mix: aspirateMix,
    delay: aspirateDelay,
  } = aspirate ?? {}

  const dispense =
    multiDispense != null && path === 'multiDispense'
      ? multiDispense
      : singleDispense

  const {
    flowRateByVolume: dispenseFlowRateByVolume,
    dispensePosition,
    delay: dispenseDelay,
  } = dispense ?? {}

  const { pushOutByVolume } = singleDispense ?? {}

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

  const { flowRate } = byVolumeLookup
  const tiprackUri = getLabwareDefURI(tipRack)

  const matchingTipLiquidSpecs = getMatchingTipLiquidSpecsFromSpec(
    pipetteSpecs,
    volume,
    tiprackUri
  )

  const aspirateCorrectionVolume = linearInterpolate(
    flowRate.aspirate,
    aspirate?.correctionByVolume as Array<[number, number]>
  )
  const dispenseCorrectionVolume = linearInterpolate(
    flowRate.dispense,
    dispense?.correctionByVolume as Array<[number, number]>
  )

  const aspirateMaxUiFlowRate = getMaxUiFlowRate({
    targetVolume: flowRate.aspirate,
    channels: pipetteSpecs.channels,
    tipLiquidSpecs: matchingTipLiquidSpecs,
    flowRateType: 'aspirate',
    correctionVolume: aspirateCorrectionVolume ?? 0,
    shaftULperMM: pipetteSpecs.shaftULperMM,
  })

  const dispenseMaxUiFlowRate = getMaxUiFlowRate({
    targetVolume: flowRate.dispense,
    channels: pipetteSpecs.channels,
    tipLiquidSpecs: matchingTipLiquidSpecs,
    flowRateType: 'dispense',
    correctionVolume: dispenseCorrectionVolume ?? 0,
    shaftULperMM: pipetteSpecs.shaftULperMM,
  })

  const aspirateFlowRateFields = getFlowRateFields(
    volume,
    aspirate?.flowRateByVolume ?? [],
    'aspirate',
    aspirateMaxUiFlowRate
  )

  const dispenseFlowRateFields = getFlowRateFields(
    volume,
    dispense?.flowRateByVolume ?? [],
    'dispense',
    dispenseMaxUiFlowRate
  )

  const { pushOut, airGap, conditioning, disposal } = byVolumeLookup

  console.log('pushOut', pushOut)
  console.log('airGap', airGap)

  const aspirateState = {
    aspirateFlowRate: aspirateFlowRateFields.aspirate_flowRate ?? 0,
    tipPositionAspirate: aspirate?.aspiratePosition.offset.z ?? 0,
    submergeAspirate: {
      speed: aspirate?.submerge.speed ?? 0,
      positionFromBottom: aspirate?.submerge.startPosition.offset.z ?? 0,
      delayDuration: aspirate?.submerge.delay.params?.duration ?? 0,
    },
    preWetTip: preWet ?? false,
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
      delayDuration: aspirate?.retract.delay.params?.duration ?? 0,
    },
    touchTipAspirate:
      aspirate?.retract.touchTip.enable === false
        ? undefined
        : aspirate?.retract.touchTip.params?.zOffset,
    touchTipAspirateSpeed:
      aspirate?.retract.touchTip.enable === false
        ? undefined
        : aspirate?.retract.touchTip.params?.speed,
    airGapAspirate: aspirate?.retract.airGapByVolume[0][1] ?? 0,
    conditionAspirate: conditioning ?? 0,
  }

  const dispenseState = {
    dispenseFlowRate: dispenseFlowRateFields.dispense_flowRate ?? 0,
    tipPositionDispense: dispense?.dispensePosition.offset.z ?? 0,
    submergeDispense: {
      speed: dispense?.submerge.speed ?? 0,
      positionFromBottom: dispense?.submerge.startPosition.offset.z ?? 0,
      delayDuration: dispense?.submerge.delay.params?.duration ?? 0,
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
    pushOutDispense: {
      volume:
        linearInterpolate(
          volume,
          singleDispense?.pushOutByVolume as Array<[number, number]>
        ) ?? 0,
    },
    retractDispense: {
      speed: dispense?.retract.speed ?? 0,
      positionFromBottom: dispense?.retract.endPosition.offset.z ?? 0,
      delayDuration: dispense?.retract.delay.params?.duration ?? 0,
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
    airGapDispense: dispense?.retract.airGapByVolume[0][1] ?? 0,
    disposalVolumeDispenseSettings: {
      volume: disposal ?? 0,
      blowOutLocation:
        convertBlowoutLocation(
          dispense?.retract.blowout?.params?.location,
          state
        ) ?? state.dropTipLocation,

      flowRate: dispense?.retract.blowout?.params?.flowRate ?? 0,
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
