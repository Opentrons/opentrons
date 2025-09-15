/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import {
  ETHANOL_LIQUID_CLASS_NAME,
  FLEX_ROBOT_TYPE,
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
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  getLiquidClassName,
  getTransferPlanAndReferenceVolumes,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import { getFlowRateFields } from './getFlowRaiteFields'
import { getMatchingTipLiquidSpecsFromSpec } from './getMatchingTipLiquidSpecsFromSpec'
import { getMaxUiFlowRate } from './getMaxUiFlowRate'

import type { BlowOutLocation, QuickTransferSummaryState } from '../types'

const DEFAULT_MM_OFFSET_FROM_BOTTOM = 1

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

  const {
    conditioningByVolume: rawConditioningByVolume = [],
    disposalByVolume: rawDisposalByVolume = [],
  } = multiDispense ?? {}
  const conditioningByVolume = rawConditioningByVolume as Array<
    [number, number]
  >
  const disposalByVolume = rawDisposalByVolume as Array<[number, number]>
  const aspirateAirGapByVolume = aspirate?.retract.airGapByVolume as Array<
    [number, number]
  >
  const numAspirateWells = state.sourceWells.length
  const numDispenseWells = state.destinationWells.length
  const byVolumeLookup = getTransferPlanAndReferenceVolumes({
    pipetteSpecs: pipette,
    tiprackDefinition: tipRack,
    numAspirateWells: numAspirateWells,
    volume: volume,
    path: path,
    numDispenseWells: numDispenseWells,
    aspirateAirGapByVolume: aspirateAirGapByVolume,
    conditioningByVolume: conditioningByVolume,
    disposalByVolume: disposalByVolume,
  }).referenceVolumes

  const { conditioning, correction } = byVolumeLookup

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
    targetVolume: volume,
    channels: pipette.channels,
    tipLiquidSpecs: matchingTipLiquidSpecs,
    flowRateType: 'aspirate',
    correctionVolume: aspirateCorrectionVolume ?? 0,
    shaftULperMM: pipette.shaftULperMM,
    robotType: FLEX_ROBOT_TYPE,
  })

  const dispenseMaxUiFlowRate = getMaxUiFlowRate({
    targetVolume: volume,
    channels: pipette.channels,
    tipLiquidSpecs: matchingTipLiquidSpecs,
    flowRateType: 'dispense',
    correctionVolume: dispenseCorrectionVolume ?? 0,
    shaftULperMM: pipette.shaftULperMM,
    robotType: FLEX_ROBOT_TYPE,
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
    tipPositionAspirate: DEFAULT_MM_OFFSET_FROM_BOTTOM,
    submergeAspirate: {
      speed: aspirate.submerge.speed,
      positionReference: POSITION_REFERENCE_TOP,
      position: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      delayDuration: aspirate.submerge.delay.params?.duration ?? 0,
    },
    preWetTip: aspirate.preWet,
    mixOnAspirate: {
      mixVolume: 0,
      repetitions: 0,
    },
    retractAspirate: {
      speed: aspirate.retract.speed ?? 0,
      positionReference: POSITION_REFERENCE_TOP,
      position: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      delayDuration: aspirate.retract.delay.params?.duration ?? 0,
    },
    touchTipAspirate: !aspirate.retract.touchTip.enable
      ? undefined
      : aspirate.retract.touchTip.params?.zOffset,
    touchTipAspirateSpeed: aspirate.retract.touchTip.params?.speed,
    conditionAspirate: conditioning ?? 0,
  }

  const dispenseState = {
    dispenseFlowRate: dispenseFlowRateFields.dispense_flowRate ?? 0,
    tipPositionDispense: DEFAULT_MM_OFFSET_FROM_BOTTOM,
    submergeDispense: {
      speed: dispense.submerge.speed,
      position: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      positionReference: POSITION_REFERENCE_TOP,
      delayDuration: dispense.submerge.delay.params?.duration ?? 0,
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
      position: SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
      positionReference: POSITION_REFERENCE_TOP,
      delayDuration: dispense.retract.delay.params?.duration ?? 0,
    },
    touchTipDispense: !dispense.retract.touchTip.enable
      ? undefined
      : dispense.retract.touchTip.params?.zOffset,
    touchTipDispenseSpeed: dispense.retract.touchTip.params?.speed,
    disposalVolumeDispenseSettings: {
      volume: 0,
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

  const tiprackUri = getLabwareDefURI(tipRack)
  const tipTypeSettings = liquidClassDef?.byPipette
    ?.find(({ pipetteModel }) => convertedPipetteName === pipetteModel)
    ?.byTipType.find(tipObject => tipObject.tiprack === tiprackUri)

  const { aspirate, singleDispense, multiDispense } = tipTypeSettings ?? {}

  const { preWet } = aspirate ?? {}

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
  const aspirateAirGapByVolume = aspirate?.retract.airGapByVolume as Array<
    [number, number]
  >
  const numAspirateWells = state.sourceWells.length
  const numDispenseWells = destinationWells.length

  const byVolumeLookup = getTransferPlanAndReferenceVolumes({
    pipetteSpecs,
    tiprackDefinition: tipRack,
    numAspirateWells: numAspirateWells,
    volume: volume,
    path: path,
    numDispenseWells: numDispenseWells,
    aspirateAirGapByVolume: aspirateAirGapByVolume,
    conditioningByVolume: conditioningByVolume,
    disposalByVolume: disposalByVolume,
  }).referenceVolumes
  const matchingTipLiquidSpecs = getMatchingTipLiquidSpecsFromSpec(
    pipetteSpecs,
    volume,
    tiprackUri
  )

  const aspirateCorrectionVolume = linearInterpolate(
    byVolumeLookup.correction.aspirate,
    aspirate?.correctionByVolume as Array<[number, number]>
  )
  const dispenseCorrectionVolume = linearInterpolate(
    byVolumeLookup.correction.dispense,
    dispense?.correctionByVolume as Array<[number, number]>
  )

  const aspirateMaxUiFlowRate = getMaxUiFlowRate({
    targetVolume: byVolumeLookup.flowRate.aspirate,
    channels: pipetteSpecs.channels,
    tipLiquidSpecs: matchingTipLiquidSpecs,
    flowRateType: 'aspirate',
    correctionVolume: aspirateCorrectionVolume ?? 0,
    shaftULperMM: pipetteSpecs.shaftULperMM,
    robotType: FLEX_ROBOT_TYPE,
  })

  // Note(kk:2025-09-05): use robotType since we will move the same functions from (app&pd) to shared-data after the release of 8.6
  const dispenseMaxUiFlowRate = getMaxUiFlowRate({
    targetVolume: byVolumeLookup.flowRate.dispense,
    channels: pipetteSpecs.channels,
    tipLiquidSpecs: matchingTipLiquidSpecs,
    flowRateType: 'dispense',
    correctionVolume: dispenseCorrectionVolume ?? 0,
    shaftULperMM: pipetteSpecs.shaftULperMM,
    robotType: FLEX_ROBOT_TYPE,
  })

  const aspirateFlowRateFields = getFlowRateFields(
    byVolumeLookup.flowRate.aspirate,
    aspirate?.flowRateByVolume ?? [],
    'aspirate',
    aspirateMaxUiFlowRate
  )

  const dispenseFlowRateFields = getFlowRateFields(
    byVolumeLookup.flowRate.dispense,
    dispense?.flowRateByVolume ?? [],
    'dispense',
    dispenseMaxUiFlowRate
  )

  const { conditioning, disposal } = byVolumeLookup

  const aspirateState = {
    aspirateFlowRate: aspirateFlowRateFields.aspirate_flowRate ?? 0,
    tipPositionAspirate: aspirate?.aspiratePosition.offset.z ?? 0,
    submergeAspirate: {
      speed: aspirate?.submerge.speed ?? 0,
      position: aspirate?.submerge.startPosition.offset.z ?? 0,
      positionReference:
        aspirate?.submerge.startPosition.positionReference ?? undefined,
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
      position: aspirate?.retract.endPosition.offset.z ?? 0,
      positionReference:
        aspirate?.retract.endPosition.positionReference ?? undefined,
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
      position: dispense?.submerge.startPosition.offset.z ?? 0,
      positionReference:
        dispense?.submerge.startPosition.positionReference ?? undefined,
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
      position: dispense?.retract.endPosition.offset.z ?? 0,
      positionReference:
        dispense?.retract.endPosition.positionReference ?? undefined,
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
