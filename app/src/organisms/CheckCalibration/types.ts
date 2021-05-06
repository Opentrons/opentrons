import type { CalibrationCheckSession } from '../../redux/sessions/types'
import { DispatchRequestsType } from '../../redux/robot-api'

export interface CalibrationCheckParentProps {
  robotName: string
  session: CalibrationCheckSession | null
  dispatchRequests: DispatchRequestsType
  isJogging: boolean
  showSpinner: boolean
  hasBlock?: boolean
}
