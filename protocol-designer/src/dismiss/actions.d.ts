import { StepIdType } from '../form-types';
export interface DismissAction<ActionType> {
    type: ActionType;
    payload: {
        type: string;
        stepId: StepIdType;
    };
}
export type DismissFormWarning = DismissAction<'DISMISS_FORM_WARNING'>;
export type DismissTimelineWarning = DismissAction<'DISMISS_TIMELINE_WARNING'>;
export declare const dismissFormWarning: (payload: DismissFormWarning['payload']) => DismissFormWarning;
export declare const dismissTimelineWarning: (payload: DismissTimelineWarning['payload']) => DismissTimelineWarning;
