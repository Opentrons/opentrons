export type ValueMasker = (value: unknown) => unknown;
export type ValueCaster = (value: unknown) => unknown;
/*********************
 **  Value Casters   **
 **********************/
export declare const maskToInteger: (rawValue: unknown) => string;
export declare const maskToFloat: (rawValue: unknown) => string;
export declare const trimDecimals: (decimals?: number) => ValueCaster;
export declare const numberOrNull: (rawValue: unknown) => number | null;
/*********************
 **  Value Limiters  **
 **********************/
export declare const onlyPositiveNumbers: ValueMasker;
export declare const defaultTo: (defaultValue: unknown) => ValueMasker;
/*******************
 **     Helpers    **
 ********************/
type ComposeMaskers = (...maskers: ValueMasker[]) => (value: unknown) => unknown;
export declare const composeMaskers: ComposeMaskers;
export {};
