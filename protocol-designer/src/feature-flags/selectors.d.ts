import { BaseState, Selector } from '../types';
import { Flags } from './types';
export declare const getFeatureFlagData: (state: BaseState) => Flags;
export declare const getEnabledPrereleaseMode: Selector<boolean | null | undefined>;
export declare const getDisableModuleRestrictions: Selector<boolean | null | undefined>;
export declare const getAllowAllTipracks: Selector<boolean>;
export declare const getEnableMultiTip: Selector<boolean>;
