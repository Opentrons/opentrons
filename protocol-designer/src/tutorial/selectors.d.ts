import { Selector } from '../types';
import { HintKey } from '.';
export declare const getHint: Selector<HintKey | null | undefined>;
export declare const getDismissedHints: Selector<HintKey[]>;
export declare const getCanClearHintDismissals: Selector<boolean>;
export declare const shouldShowCoolingHint: Selector<boolean>;
export declare const shouldShowBatchEditHint: Selector<boolean>;
export declare const shouldShowWasteChuteHint: Selector<boolean>;
