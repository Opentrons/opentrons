import type { DispatchRequestsType } from '/app/redux/robot-api'
import type { MutableRefObject } from 'react'
import type { DeckCalibrationSession } from '/app/redux/sessions/types'
export interface CalibrateDeckParentProps {
  robotName: string
  session: DeckCalibrationSession | null
  dispatchRequests: DispatchRequestsType
  requestIds: string[]
  showSpinner: boolean
  isJogging: boolean
  exitBeforeDeckConfigCompletion?: MutableRefObject<boolean>
  offsetInvalidationHandler?: () => void
}
