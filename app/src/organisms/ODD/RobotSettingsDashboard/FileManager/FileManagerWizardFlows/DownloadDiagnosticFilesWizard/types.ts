export const STEP_TYPES = {
  USB: 'usb',
  DOWNLOADING: 'downloading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

export type StepType = typeof STEP_TYPES[keyof typeof STEP_TYPES]
