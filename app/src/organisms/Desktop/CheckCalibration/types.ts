import type { CalibrationCheckSession } from '/app/redux/sessions/types'
import type { DispatchRequestsType } from '/app/redux/robot-api'

export interface CalibrationCheckParentProps {
  robotName: string
  session: CalibrationCheckSession | null
  dispatchRequests: DispatchRequestsType
  isJogging: boolean
  showSpinner: boolean
  hasBlock?: boolean
}
