import { Timeline } from '@opentrons/step-generation';
import { Substeps } from '../steplist/types';
import { GenerateRobotStateTimelineArgs } from './generateRobotStateTimeline';
import { GenerateSubstepsArgs } from './generateSubsteps';
export type SubstepsArgsNoTimeline = Omit<GenerateSubstepsArgs, 'robotStateTimeline'>;
export type WorkerCommandMessage = {
    needsTimeline: true;
    timelineArgs: GenerateRobotStateTimelineArgs;
    substepsArgs: SubstepsArgsNoTimeline;
} | {
    needsTimeline: false;
    timeline: Timeline;
    substepsArgs: SubstepsArgsNoTimeline;
};
export interface WorkerCommandEvent {
    data: WorkerCommandMessage;
}
export interface WorkerResponse {
    standardTimeline: Timeline;
    substeps: Substeps;
}
export interface WorkerResponseEvent {
    data: WorkerResponse;
}
export interface WorkerContext {
    addEventListener: (arg0: 'message', arg1: (arg0: WorkerCommandEvent) => void) => void;
    postMessage: (arg0: WorkerResponse) => void;
}
