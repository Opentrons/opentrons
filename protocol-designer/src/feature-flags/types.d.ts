export declare const DEPRECATED_FLAGS: string[];
export type FlagTypes = 'PRERELEASE_MODE' | 'OT_PD_DISABLE_MODULE_RESTRICTIONS' | 'OT_PD_ALLOW_ALL_TIPRACKS' | 'OT_PD_ENABLE_MULTI_TIP';
export declare const userFacingFlags: FlagTypes[];
export declare const allFlags: FlagTypes[];
export type Flags = Partial<Record<FlagTypes, boolean | null | undefined>>;
