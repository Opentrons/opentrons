import { linearInterpolate } from '@opentrons/shared-data'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { PathOption, QuickTransferSummaryState } from '../types'

interface CalculateWellLimitsParams {
  state: QuickTransferSummaryState
  tipRack: LabwareDefinition2
  volume: number
  path: PathOption
  conditioningByVolume: Array<[number, number]>
  disposalByVolume: Array<[number, number]>
  aspirateAirGapVolume: number
}

interface AdjustWellsResult {
  adjustedSourceWells: string[]
  adjustedDestinationWells: string[]
}

export function calculateAdjustWells({
  state,
  tipRack,
  volume,
  path,
  conditioningByVolume,
  disposalByVolume,
  aspirateAirGapVolume,
}: CalculateWellLimitsParams): AdjustWellsResult {
  const tipCapacity = tipRack?.wells?.A1?.totalLiquidVolume

  // calculate extra volumes based on path
  let extraVolumes = 0
  let minRequiredVolume = volume
  let finalMaxWells = 1

  if (path === 'multiDispense') {
    minRequiredVolume = volume * 2

    // calculate the maximum number of wells
    // by iterating and checking the total volume including disposal/conditioning
    let maxWellsForTip = 0
    let totalVolumeInTip = 0

    for (let i = 0; i < state.destinationWells.length; i++) {
      const wellsToTest = i + 1
      const volumeForWells = wellsToTest * volume

      const actualConditioningVolume =
        linearInterpolate(volumeForWells, conditioningByVolume) ?? 0
      const actualDisposalVolume =
        linearInterpolate(volumeForWells, disposalByVolume) ?? 0

      const isDisposalVolumeEnabled = actualDisposalVolume > 0
      const isConditioningVolumeEnabled = actualConditioningVolume > 0
      const airGapVolume =
        isDisposalVolumeEnabled || isConditioningVolumeEnabled
          ? 0
          : aspirateAirGapVolume

      totalVolumeInTip =
        volumeForWells +
        actualConditioningVolume +
        actualDisposalVolume +
        airGapVolume

      if (totalVolumeInTip <= tipCapacity) {
        maxWellsForTip = wellsToTest
      } else {
        break
      }
    }

    finalMaxWells = Math.max(1, maxWellsForTip)

    // calculate extraVolumes for the final number of wells
    const finalVolumeForWells = finalMaxWells * volume
    const finalConditioningVolume =
      linearInterpolate(finalVolumeForWells, conditioningByVolume) ?? 0
    const finalDisposalVolume =
      linearInterpolate(finalVolumeForWells, disposalByVolume) ?? 0
    const finalIsDisposalVolumeEnabled = finalDisposalVolume > 0
    const finalIsConditioningVolumeEnabled = finalConditioningVolume > 0
    const finalAirGapVolume =
      finalIsDisposalVolumeEnabled || finalIsConditioningVolumeEnabled
        ? 0
        : aspirateAirGapVolume
    extraVolumes = finalDisposalVolume + finalAirGapVolume
  } else if (path === 'multiAspirate') {
    minRequiredVolume = volume * 2
    extraVolumes = aspirateAirGapVolume

    const maxWellsPerTip = Math.floor((tipCapacity - extraVolumes) / volume)
    const maxWellsWithMinVolume =
      Math.floor((tipCapacity - extraVolumes) / minRequiredVolume) * 2
    finalMaxWells = Math.min(maxWellsPerTip, maxWellsWithMinVolume)
  } else {
    // Single path
    finalMaxWells = 1
  }

  // Limit wells based on path
  const adjustedDestinationWells =
    path === 'multiDispense' && finalMaxWells > 0
      ? state.destinationWells.slice(0, finalMaxWells)
      : state.destinationWells

  const adjustedSourceWells =
    path === 'multiAspirate' && finalMaxWells > 0
      ? state.sourceWells.slice(0, finalMaxWells)
      : state.sourceWells

  return {
    adjustedSourceWells,
    adjustedDestinationWells,
  }
}
