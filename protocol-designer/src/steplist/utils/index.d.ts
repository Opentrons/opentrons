import { mergeWhen } from './mergeWhen';
import { getOrderedWells } from './orderWells';
import { StepIdType } from '../../form-types';
export { mergeWhen, getOrderedWells };
export type WellRatio = 'n:n' | '1:many' | 'many:1';
export declare function getWellRatio(sourceWells?: string[] | null, destWells?: string[] | null, isDispensingIntoTrash?: boolean): WellRatio | null | undefined;
export declare const getNextNonTerminalItemId: (orderedStepIds: StepIdType[], stepsToDelete: StepIdType[]) => StepIdType | null;
