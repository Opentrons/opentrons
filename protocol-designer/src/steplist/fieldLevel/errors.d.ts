/*******************
 ** Error Messages **
 ********************/
export type FieldError = 'REQUIRED' | 'UNDER_WELL_MINIMUM' | 'NON_ZERO' | 'UNDER_RANGE_MINIMUM' | 'OVER_RANGE_MAXIMUM' | 'NOT_A_REAL_NUMBER' | 'OUTSIDE_OF_RANGE';
/*******************
 ** Error Checkers **
 ********************/
export type ErrorChecker = (value: unknown) => string | null;
export declare const requiredField: ErrorChecker;
export declare const nonZero: ErrorChecker;
export declare const minimumWellCount: (minimum: number) => ErrorChecker;
export declare const minFieldValue: (minimum: number) => ErrorChecker;
export declare const maxFieldValue: (maximum: number) => ErrorChecker;
export declare const temperatureRangeFieldValue: (minimum: number, maximum: number) => ErrorChecker;
export declare const realNumber: ErrorChecker;
/*******************
 **     Helpers    **
 ********************/
type ComposeErrors = (...errorCheckers: ErrorChecker[]) => (value: unknown) => string[];
export declare const composeErrors: ComposeErrors;
export {};
