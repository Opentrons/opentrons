export type sendReadyStatus = 'active' | 'inactive' | 'activating'
export interface RobotSystemAction {
  type: 'shell:SEND_READY_STATUS'
  payload: { shellReady: boolean }
  meta: { shell: true }
}
