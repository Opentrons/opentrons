import { getAllDefinitions, LOW_VOLUME_PIPETTES } from '@opentrons/shared-data'

import { getPipetteNameFromSpecs } from './getPipetteNameFromSpecs'

import type { PipetteV2Specs, SupportedTip } from '@opentrons/shared-data'

const LOW_PIPETTE_VOLUME = 5

export function getMatchingTipLiquidSpecsFromSpec(
  pipetteSpecs: PipetteV2Specs,
  volume: number,
  tiprackUri: string
): SupportedTip {
  const matchingLabwareDef = getAllDefinitions()[tiprackUri]
  const pipetteName = getPipetteNameFromSpecs(pipetteSpecs)

  console.assert(
    matchingLabwareDef != null,
    `expected to find a matching labware def with tiprack ${tiprackUri} but could not`
  )

  const tipLength = matchingLabwareDef?.parameters.tipLength ?? 0

  if (tipLength === 0) {
    console.error(
      `expected to find a tiplength with tiprack ${
        matchingLabwareDef?.metadata.displayName ?? 'unknown displayName'
      } but could not`
    )
  }

  const isLowVolumePipette = LOW_VOLUME_PIPETTES.includes(pipetteName)

  const isUsingLowVolume = volume < LOW_PIPETTE_VOLUME
  const liquidType =
    isLowVolumePipette && isUsingLowVolume ? 'lowVolumeDefault' : 'default'

  const liquidSupportedTips = Object.values(
    pipetteSpecs.liquids[liquidType].supportedTips
  )

  //  find the supported tip liquid specs that either exactly match
  //  tipLength or are closest, this accounts for custom tipracks
  const matchingTipLiquidSpecs = liquidSupportedTips.sort((tipA, tipB) => {
    const differenceA = Math.abs(tipA.defaultTipLength - tipLength)
    const differenceB = Math.abs(tipB.defaultTipLength - tipLength)
    return differenceA - differenceB
  })[0]

  console.assert(
    matchingTipLiquidSpecs != null,
    `expected to find the tip liquid specs but could not with pipette tiprack displayname ${
      matchingLabwareDef?.metadata.displayName ?? 'unknown displayname'
    }`
  )

  return matchingTipLiquidSpecs
}
