import { DispatchRequestsType } from '../../redux/robot-api'
import type { CalibrationCheckSession } from '../../redux/sessions/types'

export interface CalibrationCheckParentProps {
  robotName: string
  session: CalibrationCheckSession | null
  dispatchRequests: DispatchRequestsType
  isJogging: boolean
  showSpinner: boolean
  hasBlock?: boolean
}
