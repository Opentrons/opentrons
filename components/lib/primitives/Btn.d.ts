import type { PrimitiveComponent } from './types';
export declare const BUTTON_TYPE_SUBMIT: 'submit';
export declare const BUTTON_TYPE_RESET: 'reset';
export declare const BUTTON_TYPE_BUTTON: 'button';
declare type BtnComponent = PrimitiveComponent<'button'>;
/**
 * Button primitive
 *
 * @component
 */
export declare const Btn: BtnComponent;
/**
 * Primary button variant
 *
 * @component
 */
export declare const PrimaryBtn: BtnComponent;
/**
 * Secondary button variant
 *
 * @component
 */
export declare const SecondaryBtn: BtnComponent;
/**
 * Light secondary button variant
 *
 * @component
 */
export declare const LightSecondaryBtn: BtnComponent;
/**
 * Tertiary button variant
 *
 * @component
 */
export declare const TertiaryBtn: BtnComponent;
export {};
