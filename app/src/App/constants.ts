// defines a constant for the nav bar width - used in run log component to calculate centering
export const NAV_BAR_WIDTH = '5.625rem'

/**
 * Provides localized translation keys to substitute for a path segment, for breadcrumbs or menu
 * `null` indicates that a path segment should not be displayed
 * Localized keys found in unified_app.json
 * TODO(bh, 2021-2-9):: test to iterate over routes and capture defined/undefined/not allowed path segments
 */
export const translationKeyByPathSegment: { [index: string]: string | null } = {
  advanced: null,
  calibration: null,
  'deck-setup': 'deck_setup',
  devices: 'devices',
  'feature-flags': null,
  general: null,
  labware: 'labware',
  'module-controls': null,
  networking: null,
  privacy: null,
  'protocol-runs': 'protocol_runs',
  protocols: 'protocols',
  'robot-settings': 'robot_settings',
  'run-log': null,
  setup: null,
}
