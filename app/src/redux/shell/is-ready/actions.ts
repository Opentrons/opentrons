import type { RobotSystemAction } from './types'

export const SEND_READY_STATUS: 'shell:SEND_READY_STATUS' =
  'shell:SEND_READY_STATUS'

export const sendReadyStatus = (status: boolean): RobotSystemAction => ({
  type: SEND_READY_STATUS,
  payload: { shellReady: status },
  meta: { shell: true },
})
