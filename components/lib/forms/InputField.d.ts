import * as React from 'react';
export declare const INPUT_TYPE_TEXT: 'text';
export declare const INPUT_TYPE_PASSWORD: 'password';
export interface InputFieldProps {
    /** field is disabled if value is true */
    disabled?: boolean;
    /** change handler */
    onChange?: (event: React.SyntheticEvent<HTMLInputElement>) => unknown;
    /** classes to apply to outer element */
    className?: string;
    /** inline label text. DEPRECATED */
    label?: string;
    /** classes to apply to inner label text div */
    labelTextClassName?: string | null | undefined;
    /** name of field in form */
    name?: string;
    /** optional ID of <input> element */
    id?: string;
    /** placeholder text */
    placeholder?: string;
    /** optional suffix component, appears to the right of input text */
    units?: string;
    /** current value of text in box, defaults to '' */
    value?: string | null | undefined;
    /** if included, InputField will use error style and display error instead of caption */
    error?: string | null | undefined;
    /** optional caption. hidden when `error` is given */
    caption?: string | null | undefined;
    /** appears to the right of the caption. Used for character limits, eg '0/45' */
    secondaryCaption?: string | null | undefined;
    /** optional input type (default "text") */
    type?: typeof INPUT_TYPE_TEXT | typeof INPUT_TYPE_PASSWORD;
    /** mouse click handler */
    onClick?: (event: React.MouseEvent<HTMLInputElement>) => unknown;
    /** focus handler */
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => unknown;
    /** blur handler */
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => unknown;
    /** makes input field read-only */
    readOnly?: boolean | null | undefined;
    /** html tabindex property */
    tabIndex?: number;
    /** automatically focus field on render */
    autoFocus?: boolean;
    /** if true, clear out value and add '-' placeholder */
    isIndeterminate?: boolean;
}
export declare function InputField(props: InputFieldProps): JSX.Element;
