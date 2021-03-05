import * as React from 'react';
export interface DropdownOption {
    name: string;
    value: string;
    disabled?: boolean;
}
export declare type Options = DropdownOption[];
export interface DropdownFieldProps {
    /** change handler */
    onChange: React.ChangeEventHandler;
    /** focus handler */
    onFocus?: React.FocusEventHandler;
    /** blur handler */
    onBlur?: React.FocusEventHandler;
    /** value that is selected */
    value?: string | null | undefined;
    /** optional id for the <select> element */
    id?: string;
    /** name of field in form */
    name?: string;
    /** Array of {name, value} data */
    options: Options;
    /** classes to apply */
    className?: string;
    /** optional caption. hidden when `error` is given */
    caption?: string;
    /** if included, DropdownField will use error style and display error instead of caption */
    error?: string | null | undefined;
    /** dropdown is disabled if value is true */
    disabled?: boolean;
    /** html tabindex property */
    tabIndex?: number;
    /** automatically focus field on render */
    autoFocus?: boolean;
    /** if true, render indeterminate unselectable option */
    isIndeterminate?: boolean;
}
export declare function DropdownField(props: DropdownFieldProps): JSX.Element;
