import type { DispatchRequestsType } from '/app/redux/robot-api'
import type { TipLengthCalibrationSession } from '/app/redux/sessions/types'

export interface CalibrateTipLengthParentProps {
  robotName: string
  session: TipLengthCalibrationSession | null
  dispatchRequests: DispatchRequestsType
  requestIds: string[]
  showSpinner: boolean
  isJogging: boolean
  allowChangeTipRack?: boolean
  offsetInvalidationHandler?: () => void
}
