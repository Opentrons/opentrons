import { DispatchRequestsType } from '../../redux/robot-api'
import type { DeckCalibrationSession } from '../../redux/sessions/types'

export interface CalibrateDeckParentProps {
  robotName: string
  session: DeckCalibrationSession | null
  dispatchRequests: DispatchRequestsType
  showSpinner: boolean
  isJogging: boolean
  offsetInvalidationHandler?: () => void
}
