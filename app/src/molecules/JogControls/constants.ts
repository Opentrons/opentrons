import type { StepSize } from './types'

export const SMALL_STEP_SIZE_MM = 0.1 as const
export const MEDIUM_STEP_SIZE_MM = 1 as const
export const LARGE_STEP_SIZE_MM = 10 as const
export const DEFAULT_STEP_SIZES: StepSize[] = [
  SMALL_STEP_SIZE_MM,
  MEDIUM_STEP_SIZE_MM,
  LARGE_STEP_SIZE_MM,
]

export const HORIZONTAL_PLANE: 'horizontal' = 'horizontal'
export const VERTICAL_PLANE: 'vertical' = 'vertical'
