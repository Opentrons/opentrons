import { AllTemporalPropertiesForTimelineFrame } from '../../step-forms';
import type { RobotState } from '@opentrons/step-generation';
import type { Selector } from '../../types';
interface Option {
    name: string;
    value: string;
}
export declare const getRobotStateAtActiveItem: Selector<RobotState | null>;
export declare const getUnoccupiedLabwareLocationOptions: Selector<Option[] | null>;
export declare const getDeckSetupForActiveItem: Selector<AllTemporalPropertiesForTimelineFrame>;
export {};
