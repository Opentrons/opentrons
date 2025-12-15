import { getRobotSerialNumber } from '/app/redux/discovery'

import type { DiscoveredRobot } from '/app/redux/discovery/types'

export function getFallbackRobotSerialNumber(
  robot: DiscoveredRobot | null
): string {
  const sn = robot?.status != null ? getRobotSerialNumber(robot) : null
  return sn ?? ''
}

export const isSupportedVersion = (
  versionA: number[],
  versionB: number[]
): boolean => {
  const maxLength = Math.max(versionA.length, versionB.length)

  for (let i = 0; i < maxLength; i++) {
    // if the version is not defined, use 0
    const a = versionA[i] ?? 0
    const b = versionB[i] ?? 0

    if (a > b) {
      return true
    } else if (a < b) {
      return false
    }
  }
  return true
}
