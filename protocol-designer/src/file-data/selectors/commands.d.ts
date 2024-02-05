import * as StepGeneration from '@opentrons/step-generation';
import { Substeps } from '../../steplist/types';
import { BaseState, Selector } from '../../types';
import { StepIdType } from '../../form-types';
export declare const getLabwareLiquidState: Selector<StepGeneration.LabwareLiquidState>;
export declare const getInitialRobotState: (arg0: BaseState) => StepGeneration.RobotState;
export declare const getTimelineIsBeingComputed: Selector<boolean>;
export declare const getRobotStateTimeline: Selector<StepGeneration.Timeline>;
export declare const getSubsteps: Selector<Substeps>;
type WarningsPerStep = {
    [stepId in number | string]?: StepGeneration.CommandCreatorWarning[] | null;
};
export declare const timelineWarningsPerStep: Selector<WarningsPerStep>;
export declare const getErrorStepId: Selector<StepIdType | null | undefined>;
export declare const lastValidRobotState: Selector<StepGeneration.RobotState>;
export {};
