import type { HintKey } from './index';
export interface AddHintAction {
    type: 'ADD_HINT';
    payload: {
        hintKey: HintKey;
    };
}
export declare const addHint: (hintKey: HintKey) => AddHintAction;
export interface RemoveHintAction {
    type: 'REMOVE_HINT';
    payload: {
        hintKey: HintKey;
        rememberDismissal: boolean;
    };
}
export declare const removeHint: (hintKey: HintKey, rememberDismissal: boolean) => RemoveHintAction;
export interface ClearAllHintDismissalsAction {
    type: 'CLEAR_ALL_HINT_DISMISSALS';
}
export declare const clearAllHintDismissals: () => ClearAllHintDismissalsAction;
