import type { InvariantContext, RobotState } from '@opentrons/step-generation';
import { NamedIngred, StepArgsAndErrors, StepItemSourceDestRow, SubstepItemData, SubstepTimelineFrame, LabwareNamesByModuleId } from './types';
export type GetIngreds = (labware: string, well: string) => NamedIngred[];
export declare const mergeSubstepRowsSingleChannel: (args: {
    substepRows: SubstepTimelineFrame[];
    showDispenseVol: boolean;
}) => StepItemSourceDestRow[];
export declare const mergeSubstepRowsMultiChannel: (args: {
    substepRows: SubstepTimelineFrame[];
    channels: number;
    isMixStep: boolean;
    showDispenseVol: boolean;
}) => StepItemSourceDestRow[][];
export declare function generateSubstepItem(stepArgsAndErrors: StepArgsAndErrors | null | undefined, invariantContext: InvariantContext, robotState: RobotState | null | undefined, stepId: string, labwareNamesByModuleId: LabwareNamesByModuleId): SubstepItemData | null | undefined;
