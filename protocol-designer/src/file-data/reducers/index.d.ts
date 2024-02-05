import { Reducer } from 'redux';
import { Timeline } from '@opentrons/step-generation';
import { RobotType } from '@opentrons/shared-data';
import { Action } from '../../types';
import { Substeps } from '../../steplist/types';
import { FileMetadataFields } from '../types';
export declare const timelineIsBeingComputed: Reducer<boolean, any>;
export declare const computedRobotStateTimeline: Reducer<Timeline, any>;
export declare const computedSubsteps: Reducer<Substeps, any>;
export interface RootState {
    computedRobotStateTimeline: Timeline;
    computedSubsteps: Substeps;
    currentProtocolExists: boolean;
    fileMetadata: FileMetadataFields;
    timelineIsBeingComputed: boolean;
    robotType: RobotType;
}
export declare const rootReducer: Reducer<RootState, Action>;
