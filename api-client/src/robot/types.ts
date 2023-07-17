type EstopState =
  | 'physically-engaged'
  | 'logically-engaged'
  | 'not-present'
  | 'disengaged'

export interface EstopStatus {
  status: EstopState
  leftEstopPhysicalStatus: EstopState
  rightEstopPhysicalStatus: EstopState
}

export interface EstopPhysicalStatus {
  status: 'engaged' | 'disengaged' | 'not-present'
}

export interface SetEstopState {
  status: {}
}

export interface Lights {
  on: boolean
}

export interface SetLightsData {
  on: boolean
}
