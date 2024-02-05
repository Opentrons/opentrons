import * as StepGeneration from '@opentrons/step-generation';
import type { StepArgsAndErrorsById } from '../steplist/types';
export interface GenerateRobotStateTimelineArgs {
    allStepArgsAndErrors: StepArgsAndErrorsById;
    orderedStepIds: string[];
    initialRobotState: StepGeneration.RobotState;
    invariantContext: StepGeneration.InvariantContext;
}
export declare const generateRobotStateTimeline: (args: GenerateRobotStateTimelineArgs) => StepGeneration.Timeline;
