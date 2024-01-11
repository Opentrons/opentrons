import { AIR } from '@opentrons/step-generation'
import { LEGACY_COLORS } from '@opentrons/components'
export const MIXED_WELL_COLOR = '#9b9b9b' // NOTE: matches `--c-med-gray` in LEGACY_COLORS.liquidColors.css

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

  return LEGACY_COLORS.liquidColors[num % LEGACY_COLORS.liquidColors.length]
}
