import { Timeline, RobotState, InvariantContext } from '@opentrons/step-generation';
import { LabwareNamesByModuleId, StepArgsAndErrorsById, Substeps } from '../steplist/types';
export interface GenerateSubstepsArgs {
    allStepArgsAndErrors: StepArgsAndErrorsById;
    invariantContext: InvariantContext;
    orderedStepIds: string[];
    robotStateTimeline: Timeline;
    initialRobotState: RobotState;
    labwareNamesByModuleId: LabwareNamesByModuleId;
}
export declare const generateSubsteps: (args: GenerateSubstepsArgs) => Substeps;
