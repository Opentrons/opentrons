// export type SystemDevicesRunTimeCommand =

import type { CommonCommandCreateInfo, CommonCommandRunTimeInfo } from './index'

export type RobotDevicesRunTimeCommand = CaptureImageRunTimeCommand

export type RobotDevicesCreateCommand = CaptureImageCreateCommand

export type Width = number
export type Height = number

export interface CaptureImageParams {
  homeBefore?: boolean
  fileName?: string
  resolution?: [Width, Height]
  zoom?: number
  contrast?: number
  brightness?: number
  saturation?: number
}

export interface CaptureImageCreateCommand extends CommonCommandCreateInfo {
  commandType: 'captureImage'
  params: CaptureImageParams
}

export interface CaptureImageRunTimeCommand
  extends CommonCommandRunTimeInfo,
    CaptureImageCreateCommand {
  // eslint-disable-next-line @typescript-eslint/ban-types
  result?: {} // Returns an empty object currently.
}
