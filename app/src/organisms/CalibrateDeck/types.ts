import type { DeckCalibrationSession } from '../../redux/sessions/types'
import { DispatchRequestsType } from '../../redux/robot-api'

export interface CalibrateDeckParentProps {
  robotName: string
  session: DeckCalibrationSession | null
  dispatchRequests: DispatchRequestsType
  showSpinner: boolean
  isJogging: boolean
}
