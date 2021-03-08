import * as React from 'react';
import type { SelectProps } from './Select';
export interface SelectFieldProps {
    /** optional HTML id for container */
    id?: SelectProps['id'];
    /** field name */
    name: NonNullable<SelectProps['name']>;
    /** react-Select option, usually label, value */
    options: SelectProps['options'];
    /** currently selected value */
    value: string | null | undefined;
    /** disable the select */
    disabled?: SelectProps['isDisabled'];
    /** optional placeholder  */
    placeholder?: SelectProps['placeholder'];
    /** menuPosition prop to send to react-select */
    menuPosition?: SelectProps['menuPosition'];
    /** render function for the option label passed to react-select */
    formatOptionLabel?: SelectProps['formatOptionLabel'];
    /** optional className */
    className?: string;
    /** optional caption. hidden when `error` is given */
    caption?: React.ReactNode;
    /** if included, use error style and display error instead of caption */
    error?: string | null | undefined;
    /** change handler called with (name, value) */
    onValueChange?: (name: string, value: string) => unknown;
    /** blur handler called with (name) */
    onLoseFocus?: (name: string) => unknown;
}
export declare function SelectField(props: SelectFieldProps): JSX.Element;
