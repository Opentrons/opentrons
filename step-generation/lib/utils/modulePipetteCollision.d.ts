import type { InvariantContext, RobotState } from '../types';
export declare const modulePipetteCollision: (args: {
    pipette: string | null | undefined;
    labware: string | null | undefined;
    invariantContext: InvariantContext;
    prevRobotState: RobotState;
}) => boolean;
