export interface EstopPhysicalStatus {
  status: 'engaged' | 'disengaged' | 'not-present'
}

export interface EstopState {
  status:
    | 'physically-engaged'
    | 'logically-engaged'
    | 'not-present'
    | 'disengaged'
  estopPhysicalStatus: EstopPhysicalStatus
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
