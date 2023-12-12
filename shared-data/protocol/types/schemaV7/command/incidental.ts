import type { CommonCommandRunTimeInfo, CommonCommandCreateInfo } from '.'
import type { StatusBarAnimation } from '../../../../js/types'

export type IncidentalCreateCommand = SetStatusBarCreateCommand

export type IncidentalRunTimeCommand = SetStatusBarRunTimeCommand

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
