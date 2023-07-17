export type EstopState =
  | 'physically-engaged'
  | 'logically-engaged'
  | 'not-present'
  | 'disengaged'

export type EstopPhysicalStatus = 'engaged' | 'disengaged' | 'not-present'

export interface EstopStatus {
  status: EstopState
  leftEstopPhysicalStatus: EstopPhysicalStatus
  rightEstopPhysicalStatus: EstopPhysicalStatus
}

export interface Lights {
  on: boolean
}

export interface SetLightsData {
  on: boolean
}
