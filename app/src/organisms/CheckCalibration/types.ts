import type { CalibrationCheckSession } from '../../redux/sessions/types'
import type { DispatchRequestsType } from '../../redux/robot-api'

export interface CalibrationCheckParentProps {
  robotName: string
  session: CalibrationCheckSession | null
  dispatchRequests: DispatchRequestsType
  isJogging: boolean
  showSpinner: boolean
  hasBlock?: boolean
}
