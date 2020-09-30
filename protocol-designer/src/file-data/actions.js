// @flow
import type { FileMetadataFields, SaveFileMetadataAction } from './types'
import type { WorkerResponse } from '../timelineMiddleware/types'

export const saveFileMetadata = (
  payload: FileMetadataFields
): SaveFileMetadataAction => ({
  type: 'SAVE_FILE_METADATA',
  payload,
})

export type ComputeRobotStateTimelineRequestAction = {|
  type: 'COMPUTE_ROBOT_STATE_TIMELINE_REQUEST',
|}
export const computeRobotStateTimelineRequest = (): ComputeRobotStateTimelineRequestAction => ({
  type: 'COMPUTE_ROBOT_STATE_TIMELINE_REQUEST',
})

export type ComputeRobotStateTimelineSuccessAction = {|
  type: 'COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS',
  payload: WorkerResponse,
|}
export const computeRobotStateTimelineSuccess = (
  payload: WorkerResponse
): ComputeRobotStateTimelineSuccessAction => ({
  type: 'COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS',
  payload,
})
