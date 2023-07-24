export type EstopState =
  | 'physicallyEngaged'
  | 'logicallyEngaged'
  | 'notPresent'
  | 'disengaged'

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
