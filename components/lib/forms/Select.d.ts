import * as React from 'react';
import { components as reactSelectComponents } from 'react-select';
import { POSITION_ABSOLUTE, POSITION_FIXED } from '../styles';
export { reactSelectComponents };
export declare const PLACEMENT_AUTO: 'auto';
export declare const PLACEMENT_BOTTOM: 'bottom';
export declare const PLACEMENT_TOP: 'top';
export declare const CONTEXT_MENU: 'menu';
export declare const CONTEXT_VALUE: 'value';
export declare const SELECT_CX_PREFIX = "ot_select";
export declare type ChangeAction = 'select-option' | 'deselect-option' | 'remove-value' | 'pop-value' | 'set-value' | 'clear' | 'create-option';
export interface SelectOption {
    value: string;
    label?: string;
    isDisabled?: boolean;
}
export declare type SelectOptionOrGroup = SelectOption | {
    options: SelectOption[];
    label?: string;
};
export declare type SelectPlacement = typeof PLACEMENT_AUTO | typeof PLACEMENT_BOTTOM | typeof PLACEMENT_TOP;
export declare type SelectPosition = typeof POSITION_ABSOLUTE | typeof POSITION_FIXED;
export declare type SelectOptionContext = typeof CONTEXT_MENU | typeof CONTEXT_VALUE;
export interface SelectProps {
    options: SelectOptionOrGroup[];
    value?: SelectOption | null;
    defaultValue?: SelectOption | null;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    className?: string;
    id?: string;
    isDisabled?: boolean;
    isSearchable?: boolean;
    name?: string;
    menuIsOpen?: boolean;
    menuPlacement?: SelectPlacement;
    menuPosition?: SelectPosition;
    menuPortalTarget?: HTMLElement;
    placeholder?: string | null | undefined;
    tabIndex?: string | number;
    formatOptionLabel?: (option: SelectOption, data: {
        context: SelectOptionContext;
        inputValue: string;
        selectValue: SelectOption[] | SelectOption | null | undefined;
    }) => React.ReactNode;
    onBlur?: (e: React.FocusEvent<HTMLElement>) => unknown;
    onChange?: (value: SelectOption | null, action: ChangeAction) => unknown;
    onFocus?: (e: React.FocusEvent<HTMLElement>) => unknown;
}
export declare function Select(props: SelectProps): JSX.Element;
