export const SECTIONS = {
  BEFORE_BEGINNING: 'BEFORE_BEGINNING',
  ATTACH_STEM: 'ATTACH_STEM',
  DETACH_STEM: 'DETACH_STEM',
  RESULTS: 'RESULTS',
} as const

export const FLOWS = {
  ATTACH: 'ATTACH',
  DETACH: 'DETACH',
  CALIBRATE: 'CALIBRATE',
}

export const CALIBRATION_PROBE_DISPLAY_NAME = 'Calibration Probe'

//  required equipment list
export const CALIBRATION_PROBE = {
  loadName: 'calibration_probe',
  displayName: CALIBRATION_PROBE_DISPLAY_NAME,
}
