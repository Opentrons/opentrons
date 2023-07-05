export interface EstopPhysicalStatus {
  status: 'disengaged' | 'not-present'
}

export interface EstopState {
  status:
    | 'physically-engaged'
    | 'logically-engaged'
    | 'not-present'
    | 'disengaged'
  estopPhysicalStatus: EstopPhysicalStatus
}

export interface Lights {
  on: boolean
}

export interface SetLightsData {
  on: boolean
}
