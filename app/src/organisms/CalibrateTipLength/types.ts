import { DispatchRequestsType } from '../../redux/robot-api'
import type { TipLengthCalibrationSession } from '../../redux/sessions/types'

export interface CalibrateTipLengthParentProps {
  robotName: string
  session: TipLengthCalibrationSession | null
  dispatchRequests: DispatchRequestsType
  showSpinner: boolean
  isJogging: boolean
  allowChangeTipRack?: boolean
  offsetInvalidationHandler?: () => void
}
