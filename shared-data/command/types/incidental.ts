import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type { StatusBarAnimation } from '../../js/types'

export type IncidentalCreateCommand =
  | SetStatusBarCreateCommand
  | SetRailLightsCreateCommand

export type IncidentalRunTimeCommand =
  | SetStatusBarRunTimeCommand
  | SetRailLightsRunTimeCommand

export interface SetStatusBarCreateCommand extends CommonCommandCreateInfo {
  commandType: 'setStatusBar'
  params: SetStatusBarParams
}

export interface SetStatusBarRunTimeCommand
  extends CommonCommandRunTimeInfo,
    SetStatusBarCreateCommand {
  result?: any
}

interface SetStatusBarParams {
  animation: StatusBarAnimation
}

export interface SetRailLightsCreateCommand extends CommonCommandCreateInfo {
  commandType: 'setRailLights'
  params: SetRailLightsParams
}

export interface SetRailLightsRunTimeCommand
  extends CommonCommandRunTimeInfo,
    SetRailLightsCreateCommand {
  result?: any
}

interface SetRailLightsParams {
  on: boolean
}
