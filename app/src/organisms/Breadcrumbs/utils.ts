import type { PathCrumb } from './types'

export function getLinkPath(pathCrumbs: PathCrumb[], i: number): string {
  const linkPath = `/${pathCrumbs
    // use all crumbs up to the current crumb
    .slice(0, i + 1)
    // construct path with original path segment
    .map(crumb => crumb.pathSegment)
    .join('/')}`

  return linkPath
}

/**
 * Provides localized translation keys to substitute for a path segment, for breadcrumbs or menu
 * `null` indicates that a path segment should not be displayed
 * Localized keys found in top_navigation.json
 * TODO(bh, 2022-2-9):: test to iterate over routes and capture defined/undefined/not allowed path segments
 */
export function getTranslationKeyByPathSegment(
  isOnDevice: boolean
): { [index: string]: string | null } {
  return {
    advanced: null,
    calibration: null,
    'deck-setup': 'deck_setup',
    // app is on device: do not show the devices crumb
    devices: !isOnDevice ? 'devices' : null,
    'feature-flags': null,
    general: null,
    labware: 'labware',
    'module-controls': null,
    networking: null,
    privacy: null,
    // TODO(bh: 2022/4/28): show this breadcrumb path segment when the Protocol Runs page is implemented
    // 'protocol-runs': 'protocol_runs',
    'protocol-runs': null,
    protocols: 'protocols',
    'robot-settings': 'robot_settings',
    'run-log': null,
    setup: null,
  }
}
