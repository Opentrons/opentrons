import type { RobotSystemAction, RobotServerServiceStatus } from './types'

export const ROBOT_SERVER_SERVICE_STATUS: 'shell:ROBOT_SERVER_SERVICE_STATUS' =
  'shell:ROBOT_SERVER_SERVICE_STATUS'

export const robotServerServiceStatus = (
  status: RobotServerServiceStatus
): RobotSystemAction => ({
  type: ROBOT_SERVER_SERVICE_STATUS,
  payload: status,
  meta: { shell: true },
})
