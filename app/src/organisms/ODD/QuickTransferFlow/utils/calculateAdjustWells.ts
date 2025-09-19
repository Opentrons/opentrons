import { linearInterpolate } from '@opentrons/shared-data'

import type { PathOption, QuickTransferSummaryState } from '../types'

interface CalculateWellLimitsParams {
  state: QuickTransferSummaryState
  tipRack: any
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

  const actualConditioningVolume =
    linearInterpolate(volume, conditioningByVolume) ?? 0
  const actualDisposalVolume = linearInterpolate(volume, disposalByVolume) ?? 0

  // Calculate extra volumes based on path
  let extraVolumes = 0
  let minRequiredVolume = volume

  if (path === 'multiDispense') {
    minRequiredVolume = volume * 2 // Protocol-designer requirement
    const isDisposalVolumeEnabled = actualDisposalVolume > 0
    const isConditioningVolumeEnabled = actualConditioningVolume > 0
    const airGapVolume =
      isDisposalVolumeEnabled || isConditioningVolumeEnabled
        ? 0
        : aspirateAirGapVolume
    extraVolumes = actualDisposalVolume + airGapVolume
  } else if (path === 'multiAspirate') {
    minRequiredVolume = volume * 2
    extraVolumes = aspirateAirGapVolume
  }

  const maxWellsPerTip =
    path === 'single' ? 1 : Math.floor((tipCapacity - extraVolumes) / volume)

  const maxWellsWithMinVolume =
    path === 'single'
      ? 1
      : Math.floor((tipCapacity - extraVolumes) / minRequiredVolume) * 2

  const finalMaxWells = Math.min(maxWellsPerTip, maxWellsWithMinVolume)

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
