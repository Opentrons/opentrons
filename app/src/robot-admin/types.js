// @flow
import type { RobotApiRequest } from '../robot-api/types'

export type RobotAdminStatus =
  | 'up'
  | 'down'
  | 'restart-pending'
  | 'restarting'
  | 'restart-failed'

export type PerRobotAdminState = {|
  status: RobotAdminStatus,
|}

export type RobotAdminState = $Shape<{|
  [robotName: string]: void | PerRobotAdminState,
|}>

export type RobotAdminAction = {|
  type: 'robotAdmin:RESTART',
  payload: RobotApiRequest,
  meta: {| robot: true |},
|}
