import { AIR } from '@opentrons/step-generation'
export const MIXED_WELL_COLOR = '#9b9b9b' // NOTE: matches `--c-med-gray` in colors.css

// TODO factor into CSS or constants or elsewhere
export const swatchColors = (ingredGroupId: string): string => {
  const num = Number(ingredGroupId)
  const colors = [
    '#00d781',
    '#0076ff',
    '#ff4888',
    '#7b21d6',
    '#ff6161',
    '#065596',
    '#2a97dc',
    '#d24193',
  ]

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
