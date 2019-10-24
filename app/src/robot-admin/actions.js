// @flow
import { POST } from '../robot-api/utils'
import { RESTART, RESTART_PATH } from './constants'

import type { RobotHost } from '../robot-api/types'
import type { RobotAdminAction } from './types'

export const restartRobot = (host: RobotHost): RobotAdminAction => ({
  type: RESTART,
  payload: { host, method: POST, path: RESTART_PATH },
  meta: { robot: true },
})
