import type { InvariantContext, ModuleTemporalProperties, RobotState, ThermocyclerModuleState } from './';
export declare function sortLabwareBySlot(labwareState: RobotState['labware']): string[];
export declare function _getNextTip(args: {
    pipetteId: string;
    tiprackId: string;
    invariantContext: InvariantContext;
    robotState: RobotState;
}): string | null;
declare type NextTiprack = {
    tiprackId: string;
    well: string;
} | null;
export declare function getNextTiprack(pipetteId: string, invariantContext: InvariantContext, robotState: RobotState): NextTiprack;
export declare function getPipetteWithTipMaxVol(pipetteId: string, invariantContext: InvariantContext): number;
export declare function getModuleState(robotState: RobotState, module: string): ModuleTemporalProperties['moduleState'];
export declare const thermocyclerStateGetter: (robotState: RobotState, moduleId: string) => ThermocyclerModuleState | null;
export {};
