import { linearInterpolate } from '@opentrons/shared-data'

import type { PipetteV2Specs } from '@opentrons/shared-data'
import type { PathOption, ReferenceVolumes } from '@opentrons/step-generation'

export const getTransferPlanAndReferenceVolumes = (args: {
  pipetteSpecs: PipetteV2Specs
  maxWorkingVolumeTip?: number
  volume: number
  path: PathOption
  numDispenseWells: number
  aspirateAirGapByVolume: Array<[number, number]>
  conditioningByVolume: Array<[number, number]> | null
  disposalByVolume: Array<[number, number]> | null
}): {
  referenceVolumes: ReferenceVolumes
  multiWellHandling: {
    isSupported: boolean
    numWellsToFitInTip?: number
  }
} => {
  const {
    path,
    volume,
    pipetteSpecs,
    maxWorkingVolumeTip,
    conditioningByVolume,
    disposalByVolume,
    numDispenseWells,
    aspirateAirGapByVolume,
  } = args
  const { liquids } = pipetteSpecs
  const isInLowVolumeMode =
    volume < liquids.default.minVolume && 'lowVolumeDefault' in liquids
  const maxWorkingVolumePipette = isInLowVolumeMode
    ? liquids.lowVolumeDefault.maxVolume
    : liquids.default.maxVolume
  const maxWorkingVolume =
    maxWorkingVolumeTip == null
      ? maxWorkingVolumePipette
      : Math.min(maxWorkingVolumePipette, maxWorkingVolumeTip)
  const minVolumeForMultiAspirateDispense = volume * 2
  const conditioningVolumeForMultiAspirateDispense =
    conditioningByVolume != null
      ? linearInterpolate(
          minVolumeForMultiAspirateDispense,
          conditioningByVolume
        ) ?? 0
      : 0
  const isMultiDispenseAvailable =
    conditioningByVolume != null &&
    disposalByVolume != null &&
    maxWorkingVolume >=
      minVolumeForMultiAspirateDispense +
        conditioningVolumeForMultiAspirateDispense +
        (linearInterpolate(
          minVolumeForMultiAspirateDispense,
          disposalByVolume
        ) ?? 0) +
        // don't take air gap into account if conditioning volume is present
        (conditioningVolumeForMultiAspirateDispense === 0
          ? linearInterpolate(
              minVolumeForMultiAspirateDispense,
              aspirateAirGapByVolume
            ) ?? 0
          : 0)
  const isMultiAspirateAvailable =
    maxWorkingVolume > minVolumeForMultiAspirateDispense

  // early return if multiAspirate/multiDispense cannot be accommodated
  if (
    path === 'single' ||
    (path === 'multiDispense' && !isMultiDispenseAvailable) ||
    (path === 'multiAspirate' && !isMultiAspirateAvailable)
  ) {
    const aspirateAirGapAtSpecifiedVolume =
      linearInterpolate(volume, aspirateAirGapByVolume) ?? 0
    // split if target volume + air gap volume > maxWorkingVolume
    const numAspirations = Math.ceil(
      (volume + aspirateAirGapAtSpecifiedVolume) / maxWorkingVolume
    )
    const volumePerAspiration = volume / numAspirations
    return {
      referenceVolumes: {
        airGap: {
          aspirate: volumePerAspiration,
          dispense: 0,
        },
        correction: {
          aspirate: volumePerAspiration,
          dispense: volumePerAspiration,
        },
        pushOut: volumePerAspiration,
        flowRate: {
          aspirate: volumePerAspiration,
          dispense: volumePerAspiration,
        },
      },
      multiWellHandling: {
        isSupported: false,
      },
    }
  }

  if (path === 'multiDispense') {
    let totalVolumeForMultiDispense: number = 0
    let numDestinationsPerAspiration: number = 0
    for (let i = 0; i < numDispenseWells; i++) {
      const next = _getTotalVolumeForMultiDispense(
        (i + 1) * volume,
        conditioningByVolume ?? [],
        disposalByVolume ?? []
      )
      if (next > maxWorkingVolume) {
        break
      } else {
        totalVolumeForMultiDispense = (i + 1) * volume
        numDestinationsPerAspiration += 1
      }
    }
    return {
      referenceVolumes: {
        airGap: {
          aspirate: _getTotalVolumeForMultiDispense(
            totalVolumeForMultiDispense,
            conditioningByVolume ?? [],
            disposalByVolume ?? [],
            false
          ),
          dispense: _getTotalVolumeForMultiDispense(
            // here, we interpolate the post-dispense air gap volume based on the total volume in the tip
            // after the first dispense
            (numDestinationsPerAspiration - 1) * volume,
            conditioningByVolume ?? [],
            disposalByVolume ?? [],
            false
          ),
        },
        correction: {
          aspirate: _getTotalVolumeForMultiDispense(
            totalVolumeForMultiDispense,
            conditioningByVolume ?? [],
            disposalByVolume ?? []
          ),
          dispense: volume,
        },
        flowRate: {
          aspirate: _getTotalVolumeForMultiDispense(
            totalVolumeForMultiDispense,
            conditioningByVolume ?? [],
            disposalByVolume ?? []
          ),
          dispense: volume,
        },
        pushOut: volume,
        conditioning: totalVolumeForMultiDispense,
        disposal: totalVolumeForMultiDispense,
      },
      multiWellHandling: {
        isSupported: true,
        numWellsToFitInTip: numDestinationsPerAspiration,
      },
    }
  }
  // path is valid multiAspirate
  const maxSourcesPerAspiration = Math.floor(maxWorkingVolume / volume)
  const volumeTotalAspiration = maxSourcesPerAspiration * volume
  return {
    referenceVolumes: {
      airGap: {
        // here, we interpolate the post-aspirate air gap volume based on the total volume in the tip
        // after the final aspiration
        aspirate: volumeTotalAspiration,
        dispense: 0,
      },
      pushOut: volumeTotalAspiration,
      correction: {
        aspirate: volumeTotalAspiration,
        dispense: volumeTotalAspiration,
      },
      flowRate: {
        aspirate: volume,
        dispense: volumeTotalAspiration,
      },
    },
    multiWellHandling: {
      isSupported: true,
      numWellsToFitInTip: maxSourcesPerAspiration,
    },
  }
}

// ToDo (kk:06/25/2025) in the future, we would like to export this from step-generation
const _getTotalVolumeForMultiDispense = (
  targetVol: number,
  conditioningByVolume: Array<[number, number]>,
  disposalByVolume: Array<[number, number]>,
  includeConditioning: boolean = true
): number => {
  const interpolatedConditioningVolume =
    linearInterpolate(targetVol, conditioningByVolume) ?? 0
  const interpolatedDisposalVolume =
    linearInterpolate(targetVol, disposalByVolume) ?? 0
  return (
    targetVol +
    (includeConditioning ? interpolatedConditioningVolume : 0) +
    interpolatedDisposalVolume
  )
}
