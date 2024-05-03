import { LOW_VOLUME_PIPETTES, getPipetteSpecsV2 } from '@opentrons/shared-data'
import type { PipetteName } from '@opentrons/shared-data'

export function getDefaultBlowoutFlowRate(
  pipetteName: PipetteName,
  volume: number,
  tipLength: number
): number {
  const specs = getPipetteSpecsV2(pipetteName)

  console.assert(
    specs,
    `expected to find pipette specs from pipetteName ${pipetteName} but could not`
  )

  const isLowVolumePipette = LOW_VOLUME_PIPETTES.includes(pipetteName)
  const isUsingLowVolume = volume < 5
  const liquidType =
    isLowVolumePipette && isUsingLowVolume ? 'lowVolumeDefault' : 'default'
  const liquidSupportedTips =
    specs != null ? Object.values(specs.liquids[liquidType].supportedTips) : []

  //  find the supported tip liquid specs that either exactly match
  //  tipLength or are closest, this accounts for custom tipracks
  const matchingTipLiquidSpecs = liquidSupportedTips.sort((tipA, tipB) => {
    const differenceA = Math.abs(tipA.defaultTipLength - tipLength)
    const differenceB = Math.abs(tipB.defaultTipLength - tipLength)
    return differenceA - differenceB
  })[0]
  console.assert(
    matchingTipLiquidSpecs,
    `expected to find the tip liquid specs but could not with pipetteName ${pipetteName}`
  )

  return matchingTipLiquidSpecs.defaultBlowOutFlowRate.default
}
