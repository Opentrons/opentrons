export interface DoorStatus {
  data: {
    status: 'open' | 'closed'
    doorRequiredClosedForProtocol: boolean
    moduleSerial: string | null
  }
}
export type EstopState =
  'physicallyEngaged' | 'logicallyEngaged' | 'notPresent' | 'disengaged'

export type EstopPhysicalStatus = 'engaged' | 'disengaged' | 'notPresent'

export interface EstopStatus {
  data: {
    status: EstopState
    leftEstopPhysicalStatus: EstopPhysicalStatus
    rightEstopPhysicalStatus: EstopPhysicalStatus
  }
}

export interface Lights {
  on: boolean
}

export interface SetLightsData {
  on: boolean
}

export type HomeTarget = 'robot' | 'pipette'

export type HomeData =
  { target: 'robot' } | { target: 'pipette'; mount: 'left' | 'right' }

export interface HomeResponse {
  message: string
}

export interface RobotSettingsField {
  id: string
  title: string
  description: string
  value: boolean | null
  restart_required?: boolean
}

export type RobotSettings = RobotSettingsField[]

export interface UpdateRobotSettingRequest {
  id: string
  value: boolean | null
}

export interface RobotSettingsResponse {
  settings: RobotSettings
  links?: { restart?: string }
}
