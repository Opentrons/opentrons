import * as React from 'react';
import { StepFieldName } from '../../form-types';
/*******************
 ** Error Messages **
 ********************/
export type FormErrorKey = 'INCOMPATIBLE_ASPIRATE_LABWARE' | 'INCOMPATIBLE_DISPENSE_LABWARE' | 'INCOMPATIBLE_LABWARE' | 'WELL_RATIO_MOVE_LIQUID' | 'PAUSE_TYPE_REQUIRED' | 'VOLUME_TOO_HIGH' | 'TIME_PARAM_REQUIRED' | 'PAUSE_TEMP_PARAM_REQUIRED' | 'MAGNET_ACTION_TYPE_REQUIRED' | 'ENGAGE_HEIGHT_MIN_EXCEEDED' | 'ENGAGE_HEIGHT_MAX_EXCEEDED' | 'ENGAGE_HEIGHT_REQUIRED' | 'MODULE_ID_REQUIRED' | 'TARGET_TEMPERATURE_REQUIRED' | 'BLOCK_TEMPERATURE_REQUIRED' | 'LID_TEMPERATURE_REQUIRED' | 'PROFILE_VOLUME_REQUIRED' | 'PROFILE_LID_TEMPERATURE_REQUIRED' | 'BLOCK_TEMPERATURE_HOLD_REQUIRED' | 'LID_TEMPERATURE_HOLD_REQUIRED';
export interface FormError {
    title: string;
    body?: React.ReactNode;
    dependentFields: StepFieldName[];
}
interface HydratedFormData {
    [key: string]: any;
}
export type FormErrorChecker = (arg: HydratedFormData) => FormError | null;
/*******************
 ** Error Checkers **
 ********************/
export declare const incompatibleLabware: (fields: HydratedFormData) => FormError | null;
export declare const incompatibleDispenseLabware: (fields: HydratedFormData) => FormError | null;
export declare const incompatibleAspirateLabware: (fields: HydratedFormData) => FormError | null;
export declare const pauseForTimeOrUntilTold: (fields: HydratedFormData) => FormError | null;
export declare const wellRatioMoveLiquid: (fields: HydratedFormData) => FormError | null;
export declare const volumeTooHigh: (fields: HydratedFormData) => FormError | null;
export declare const magnetActionRequired: (fields: HydratedFormData) => FormError | null;
export declare const engageHeightRequired: (fields: HydratedFormData) => FormError | null;
export declare const moduleIdRequired: (fields: HydratedFormData) => FormError | null;
export declare const targetTemperatureRequired: (fields: HydratedFormData) => FormError | null;
export declare const profileVolumeRequired: (fields: HydratedFormData) => FormError | null;
export declare const profileTargetLidTempRequired: (fields: HydratedFormData) => FormError | null;
export declare const blockTemperatureRequired: (fields: HydratedFormData) => FormError | null;
export declare const lidTemperatureRequired: (fields: HydratedFormData) => FormError | null;
export declare const blockTemperatureHoldRequired: (fields: HydratedFormData) => FormError | null;
export declare const lidTemperatureHoldRequired: (fields: HydratedFormData) => FormError | null;
export declare const engageHeightRangeExceeded: (fields: HydratedFormData) => FormError | null;
/*******************
 **     Helpers    **
 ********************/
type ComposeErrors = (...errorCheckers: FormErrorChecker[]) => (arg: HydratedFormData) => FormError[];
export declare const composeErrors: ComposeErrors;
export {};
