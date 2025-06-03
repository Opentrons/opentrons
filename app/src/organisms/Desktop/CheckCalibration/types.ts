import type { DispatchRequestsType } from '/app/redux/robot-api'
import type { CalibrationCheckSession } from '/app/redux/sessions/types'

export interface CalibrationCheckParentProps {
  robotName: string
  session: CalibrationCheckSession | null
  dispatchRequests: DispatchRequestsType
  isJogging: boolean
  showSpinner: boolean
  hasBlock?: boolean
}
