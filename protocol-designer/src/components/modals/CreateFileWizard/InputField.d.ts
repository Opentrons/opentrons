import * as React from 'react';
export declare const INPUT_TYPE_NUMBER: "number";
export declare const INPUT_TYPE_TEXT: "text";
export declare const INPUT_TYPE_PASSWORD: "password";
export interface InputFieldProps {
    /** field is disabled if value is true */
    disabled?: boolean;
    /** change handler */
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    /** name of field in form */
    name?: string;
    /** optional ID of <input> element */
    id?: string;
    /** placeholder text */
    placeholder?: string;
    /** optional suffix component, appears to the right of input text */
    units?: React.ReactNode;
    /** current value of text in box, defaults to '' */
    value?: string | number | null;
    /** if included, InputField will use error style and display error instead of caption */
    error?: string | null;
    /** optional caption. hidden when `error` is given */
    caption?: string | null;
    /** appears to the right of the caption. Used for character limits, eg '0/45' */
    secondaryCaption?: string | null;
    /** optional input type (default "text") */
    type?: typeof INPUT_TYPE_TEXT | typeof INPUT_TYPE_PASSWORD | typeof INPUT_TYPE_NUMBER;
    /** mouse click handler */
    onClick?: (event: React.MouseEvent<HTMLInputElement>) => unknown;
    /** focus handler */
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => unknown;
    /** blur handler */
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => unknown;
    /** makes input field read-only */
    readOnly?: boolean | undefined;
    /** html tabindex property */
    tabIndex?: number;
    /** automatically focus field on renders */
    autoFocus?: boolean;
    /** if true, clear out value and add '-' placeholder */
    isIndeterminate?: boolean;
    /** if input type is number, these are the min and max values */
    max?: number;
    min?: number;
}
export declare function InputField(props: InputFieldProps): JSX.Element;
