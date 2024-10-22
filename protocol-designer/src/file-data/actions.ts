import type {
  FileMetadataFields,
  SaveFileMetadataAction,
  SelectDesignerTabAction,
} from './types'
import type { WorkerResponse } from '../timelineMiddleware/types'
export const saveFileMetadata = (
  payload: FileMetadataFields
): SaveFileMetadataAction => ({
  type: 'SAVE_FILE_METADATA',
  payload,
})
export interface ComputeRobotStateTimelineRequestAction {
  type: 'COMPUTE_ROBOT_STATE_TIMELINE_REQUEST'
}
export const computeRobotStateTimelineRequest = (): ComputeRobotStateTimelineRequestAction => ({
  type: 'COMPUTE_ROBOT_STATE_TIMELINE_REQUEST',
})
export interface ComputeRobotStateTimelineSuccessAction {
  type: 'COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS'
  payload: WorkerResponse
}
export const computeRobotStateTimelineSuccess = (
  payload: WorkerResponse
): ComputeRobotStateTimelineSuccessAction => ({
  type: 'COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS',
  payload,
})

export interface DesignerTabPayload {
  tab: 'protocolSteps' | 'startingDeck'
}

export const selectDesignerTab = (
  payload: DesignerTabPayload
): SelectDesignerTabAction => ({
  type: 'SELECT_DESIGNER_TAB',
  payload,
})
