import { AIR } from '@opentrons/step-generation'
import { COLORS } from '@opentrons/components'
export const MIXED_WELL_COLOR = '#9b9b9b' // NOTE: matches `--c-med-gray` in colors.css

// TODO factor into CSS or constants or elsewhere
export const colors = [
  COLORS.electricPurple,
  COLORS.goldenYellow,
  COLORS.aquamarine,
  COLORS.orangePeel,
  COLORS.skyBlue,
  COLORS.popPink,
  COLORS.richBlue,
  COLORS.springGreen,
  COLORS.tartRed,
  COLORS.whaleGrey,
]

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

  return colors[num % colors.length]
}
