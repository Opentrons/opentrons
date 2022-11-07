export const SECTIONS = {
  BEFORE_BEGINNING: 'BEFORE_BEGINNING',
  ATTACH_PROBE: 'ATTACH_PROBE',
  DETACH_PROBE: 'DETACH_PROBE',
  RESULTS: 'RESULTS',
  MOUNT_PIPETTE: 'MOUNT_PIPETTE',
  DETACH_PIPETTE: 'DETACH_PIPETTE',
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
