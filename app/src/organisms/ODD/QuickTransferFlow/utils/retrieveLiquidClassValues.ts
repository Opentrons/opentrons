/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import {
  FLEX_ROBOT_TYPE,
  getAllLiquidClassDefs,
  getFlexNameConversion,
  getLabwareDefURI,
  linearInterpolate,
  NONE_LIQUID_CLASS_NAME,
  POSITION_REFERENCE_TOP,
  SAFE_MOVE_TO_WELL_OFFSET_FROM_TOP_MM,
  TRASH_BIN_ADAPTER_FIXTURE,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'
import { getTransferPlanAndReferenceVolumes } from '@opentrons/step-generation'

import { calculateAdjustWells } from './calculateAdjustWells'
import { convertBlowoutLocation } from './convertBlowoutLocation'
import { getFlowRateFields } from './getFlowRaiteFields'
import { getMatchingTipLiquidSpecsFromSpec } from './getMatchingTipLiquidSpecsFromSpec'
import { getMaxUiFlowRate } from './getMaxUiFlowRate'

import type { QuickTransferSummaryState } from '../types'

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

  const { referenceVolumes: byVolumeLookup } =
    getTransferPlanAndReferenceVolumes({
      pipetteSpecs: pipette,
      tiprackDefinition: tipRack,
      numAspirateWells,
      volume,
      path,
      numDispenseWells,
      aspirateAirGapByVolume,
      conditioningByVolume,
      disposalByVolume,
    })

  const actualConditioningVolume =
    linearInterpolate(volume, conditioningByVolume) ?? 0
  const aspirateAirGapVolume = aspirate?.retract.airGapByVolume[0][1] ?? 0

  // Calculate extra volumes based on path
  const { adjustedSourceWells, adjustedDestinationWells } =
    calculateAdjustWells({
      state,
      tipRack,
      volume,
      path,
      conditioningByVolume,
      disposalByVolume,
      aspirateAirGapVolume,
    })
  const { correction } = byVolumeLookup

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
    tiprackUri
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
    conditionAspirate: actualConditioningVolume ?? 0,
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
          state.dropTipLocation
        ) ??
        ('cutoutFixtureId' in state.dropTipLocation
          ? state.dropTipLocation
          : {
              cutoutId: 'cutoutA3',
              cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
            }),
      flowRate: dispenseFlowRateFields.dispense_flowRate ?? 0,
    },
  }

  if (liquidHandlingAction === 'all') {
    return {
      ...state,
      sourceWells: adjustedSourceWells,
      destinationWells: adjustedDestinationWells,
      ...aspirateState,
      ...dispenseState,
    }
  }
  if (liquidHandlingAction === 'aspirate') {
    return {
      ...state,
      sourceWells: adjustedSourceWells,
      destinationWells: adjustedDestinationWells,
      ...aspirateState,
    }
  } else {
    return {
      ...state,
      sourceWells: adjustedSourceWells,
      destinationWells: adjustedDestinationWells,
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

  const selectedLiquidClass = state.liquidClassName ?? NONE_LIQUID_CLASS_NAME

  const liquidClassDef = allLiquidClassDefs[selectedLiquidClass]

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

  const { referenceVolumes: byVolumeLookup } =
    getTransferPlanAndReferenceVolumes({
      pipetteSpecs,
      tiprackDefinition: tipRack,
      numAspirateWells,
      volume,
      path,
      numDispenseWells,
      aspirateAirGapByVolume,
      conditioningByVolume,
      disposalByVolume,
    })

  const aspirateAirGapVolume = aspirate?.retract.airGapByVolume[0][1] ?? 0

  const { adjustedSourceWells, adjustedDestinationWells } =
    calculateAdjustWells({
      state,
      tipRack,
      volume,
      path,
      conditioningByVolume,
      disposalByVolume,
      aspirateAirGapVolume,
    })

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

  const conditioningVolume =
    linearInterpolate(volume, conditioningByVolume) ?? 0

  const disposalVolume = linearInterpolate(volume, disposalByVolume) ?? 0

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
    conditionAspirate: conditioningVolume ?? 0,
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
              state.dropTipLocation
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
      volume: disposalVolume,
      blowOutLocation:
        convertBlowoutLocation(
          dispense?.retract.blowout?.params?.location,
          state.dropTipLocation
        ) ??
        ('cutoutFixtureId' in state.dropTipLocation
          ? state.dropTipLocation
          : {
              cutoutId: 'cutoutA3',
              cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
            }),
      flowRate: dispenseFlowRateFields.dispense_flowRate ?? 0,
    },
  }

  if (liquidHandlingAction === 'all') {
    return {
      ...state,
      sourceWells: adjustedSourceWells,
      destinationWells: adjustedDestinationWells,
      ...aspirateState,
      ...dispenseState,
    }
  }
  if (liquidHandlingAction === 'aspirate') {
    return {
      ...state,
      sourceWells: adjustedSourceWells,
      destinationWells: adjustedDestinationWells,
      ...aspirateState,
    }
  } else {
    return {
      ...state,
      sourceWells: adjustedSourceWells,
      destinationWells: adjustedDestinationWells,
      ...dispenseState,
    }
  }
}
