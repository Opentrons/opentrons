import { COLORS } from '@opentrons/components'
import { AIR } from '@opentrons/step-generation'

import type { Liquid } from '@opentrons/shared-data'
import type { LocationLiquidState } from '@opentrons/step-generation'

interface TipSvgInfo {
  tipColor: string
  tipCurrentVolume: number
  airGapVolume: number
}

export const getTipSvgInfo = (
  pipetteLocationLiquidState: LocationLiquidState,
  liquids: Liquid[]
): TipSvgInfo => {
  const ingredIds = Object.keys(pipetteLocationLiquidState)
  const airGapVolume = pipetteLocationLiquidState[AIR]?.volume ?? 0
  const colorsInTip = liquids.reduce<string[]>(
    (acc, { id, displayColor }) =>
      ingredIds.includes(id) && displayColor ? [...acc, displayColor] : acc,
    []
  )
  const tipColor =
    colorsInTip.length > 1 ? COLORS.grey40 : (colorsInTip[0] ?? COLORS.grey40)
  const tipCurrentVolume = Object.values(pipetteLocationLiquidState).reduce(
    (sum, { volume }) => sum + volume,
    0
  )
  return { tipColor, tipCurrentVolume, airGapVolume }
}
