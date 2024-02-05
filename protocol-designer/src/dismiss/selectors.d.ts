import { FormWarning } from '../steplist';
import { BaseState, Selector } from '../types';
import { RootState, DismissedWarningsAllSteps, WarningType } from './reducers';
export declare const rootSelector: (state: BaseState) => RootState;
export declare const getAllDismissedWarnings: Selector<any>;
export declare const getDismissedFormWarningTypesPerStep: Selector<DismissedWarningsAllSteps>;
export declare const getDismissedTimelineWarningTypes: Selector<DismissedWarningsAllSteps>;
export declare const getDismissedFormWarningTypesForSelectedStep: Selector<WarningType[]>;
/** Non-dismissed form-level warnings for selected step */
export declare const getFormWarningsForSelectedStep: Selector<FormWarning[]>;
export declare const getHasFormLevelWarningsPerStep: Selector<Record<string, boolean>>;
