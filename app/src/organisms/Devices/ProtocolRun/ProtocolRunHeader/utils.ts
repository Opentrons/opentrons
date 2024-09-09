import { getRobotSerialNumber } from '../../../../redux/discovery'

import type { DiscoveredRobot } from '../../../../redux/discovery/types'

export function getFallbackRobotSerialNumber(
  robot: DiscoveredRobot | null
): string {
  const sn = robot?.status != null ? getRobotSerialNumber(robot) : null
  return sn ?? ''
}
