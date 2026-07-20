export const STEP_TYPES = {
  USB: 'usb',
  CONFIRM_DELETE: 'confirm_delete',
  DOWNLOADING: 'downloading',
  DELETING: 'deleting',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

export type StepType = (typeof STEP_TYPES)[keyof typeof STEP_TYPES]
