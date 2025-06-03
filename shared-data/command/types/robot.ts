import type { CommonCommandCreateInfo, CommonCommandRunTimeInfo } from '.'
import type { GantryMount, MotorAxis } from '../../js/types'

export type RobotRunTimeCommand =
  | RobotMoveToRunTimeCommand
  | RobotMoveAxesToRunTimeCommand
  | RobotMoveAxesRelativeRunTimeCommand
  | RobotOpenGripperJawRunTimeCommand
  | RobotCloseGripperJawRunTimeCommand
export type RobotCreateCommand =
  | RobotMoveToCreateCommand
  | RobotMoveAxesToCreateCommand
  | RobotMoveAxesRelativeCreateCommand
  | RobotOpenGripperJawCreateCommand
  | RobotCloseGripperJawCreateCommand

export type RobotMotorAxisMap = Record<MotorAxis, number>
export type GantryAxisMap =
  | { x: number; y: number; leftZ: number }
  | { x: number; y: number; rightZ: number }

export interface RobotMoveToParams {
  mount: GantryMount
  destination: { x: number; y: number; z: number }
  speed?: number
}

export interface RobotMoveToCreateCommand extends CommonCommandCreateInfo {
  commandType: 'robot/moveTo'
  params: RobotMoveToParams
}
export interface RobotMoveToRunTimeCommand
  extends CommonCommandRunTimeInfo,
    RobotMoveToCreateCommand {
  result?: any
}

export interface RobotMoveAxesToParams {
  axis_map: RobotMotorAxisMap
  critical_point?: GantryAxisMap
  speed?: number
}

export interface RobotMoveAxesToCreateCommand extends CommonCommandCreateInfo {
  commandType: 'robot/moveAxesTo'
  params: RobotMoveAxesToParams
}

export interface RobotMoveAxesToRunTimeCommand
  extends CommonCommandRunTimeInfo,
    RobotMoveAxesToCreateCommand {
  result?: {
    position: RobotMotorAxisMap
  }
}

export interface RobotMoveAxesRelativeParams {
  axis_map: RobotMotorAxisMap
  speed?: number
}

export interface RobotMoveAxesRelativeCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'robot/moveAxesRelative'
  params: RobotMoveAxesRelativeParams
}

export interface RobotMoveAxesRelativeRunTimeCommand
  extends CommonCommandRunTimeInfo,
    RobotMoveAxesRelativeCreateCommand {
  result?: {
    position: RobotMotorAxisMap
  }
}

export interface RobotOpenGripperJawCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'robot/openGripperJaw'
  params: {}
}

export interface RobotOpenGripperJawRunTimeCommand
  extends CommonCommandRunTimeInfo,
    RobotOpenGripperJawCreateCommand {
  result?: any
}

export interface RobotCloseGripperJawCreateCommand
  extends CommonCommandCreateInfo {
  commandType: 'robot/closeGripperJaw'
  params: {}
}

export interface RobotCloseGripperJawRunTimeCommand
  extends CommonCommandRunTimeInfo,
    RobotCloseGripperJawCreateCommand {
  result?: any
}
