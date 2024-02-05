import { FileMetadataFields, SaveFileMetadataAction } from './types';
import { WorkerResponse } from '../timelineMiddleware/types';
export declare const saveFileMetadata: (payload: FileMetadataFields) => SaveFileMetadataAction;
export interface ComputeRobotStateTimelineRequestAction {
    type: 'COMPUTE_ROBOT_STATE_TIMELINE_REQUEST';
}
export declare const computeRobotStateTimelineRequest: () => ComputeRobotStateTimelineRequestAction;
export interface ComputeRobotStateTimelineSuccessAction {
    type: 'COMPUTE_ROBOT_STATE_TIMELINE_SUCCESS';
    payload: WorkerResponse;
}
export declare const computeRobotStateTimelineSuccess: (payload: WorkerResponse) => ComputeRobotStateTimelineSuccessAction;
