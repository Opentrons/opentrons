import { FormError } from './errors';
/*******************
 ** Warning Messages **
 ********************/
export type FormWarningType = 'BELOW_PIPETTE_MINIMUM_VOLUME' | 'OVER_MAX_WELL_VOLUME' | 'BELOW_MIN_DISPOSAL_VOLUME' | 'BELOW_MIN_AIR_GAP_VOLUME';
export type FormWarning = FormError & {
    type: FormWarningType;
};
export type WarningChecker = (val: unknown) => FormWarning | null;
/*******************
 ** Warning Checkers **
 ********************/
export type HydratedFormData = any;
export declare const belowPipetteMinimumVolume: (fields: HydratedFormData) => FormWarning | null;
export declare const maxDispenseWellVolume: (fields: HydratedFormData) => FormWarning | null;
export declare const minDisposalVolume: (fields: HydratedFormData) => FormWarning | null;
export declare const _minAirGapVolume: (checkboxField: 'aspirate_airGap_checkbox' | 'dispense_airGap_checkbox', volumeField: 'aspirate_airGap_volume' | 'dispense_airGap_volume') => (fields: HydratedFormData) => FormWarning | null;
export declare const minAspirateAirGapVolume: (fields: HydratedFormData) => FormWarning | null;
export declare const minDispenseAirGapVolume: (fields: HydratedFormData) => FormWarning | null;
/*******************
 **     Helpers    **
 ********************/
type ComposeWarnings = (...warningCheckers: WarningChecker[]) => (formData: unknown) => FormWarning[];
export declare const composeWarnings: ComposeWarnings;
export {};
