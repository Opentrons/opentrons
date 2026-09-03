import type { STEP_TYPES } from './constants'

export type StepType = (typeof STEP_TYPES)[keyof typeof STEP_TYPES]
