export type RobotServerServiceStatus = 'active' | 'inactive' | 'activating'

export interface RobotSystemState {
  robotServerStatus: RobotServerServiceStatus
}

export interface RobotSystemAction {
  type: 'shell:ROBOT_SERVER_SERVICE_STATUS'
  payload: RobotServerServiceStatus
  meta: { shell: true }
}
