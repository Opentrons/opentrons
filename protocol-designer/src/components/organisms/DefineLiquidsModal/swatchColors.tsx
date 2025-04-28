import { COLORS } from '@opentrons/components'
import { DEFAULT_LIQUID_COLORS } from '@opentrons/shared-data'
import { AIR } from '@opentrons/step-generation'

export const MIXED_WELL_COLOR = COLORS.grey50

export const swatchColors = (ingredGroupId: string): string => {
  const num = Number(ingredGroupId)

  if (!Number.isInteger(num)) {
    if (ingredGroupId !== AIR) {
      console.warn(
        `swatchColors expected an integer or ${AIR}, got ${ingredGroupId}`
      )
    }

    return 'transparent'
  }

  return DEFAULT_LIQUID_COLORS[num % DEFAULT_LIQUID_COLORS.length]
}
