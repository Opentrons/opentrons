import { OPENTRONS_USB } from '/app/redux/discovery/constants'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

import type { HostConfig } from '@opentrons/api-client'

export interface RobotUpdateHostFields {
  ip: string
  port?: number | null
  name: string
}

/**
 * HostConfig for robot-update API calls and shell upload.
 */
export function buildHostConfig(
  robot: RobotUpdateHostFields,
  token?: string | null
): HostConfig {
  return {
    hostname: robot.ip,
    port: robot.port,
    robotName: robot.name,
    token,
    requestor: robot.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined,
  }
}
