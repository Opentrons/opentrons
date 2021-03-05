import * as React from 'react';
import type { HoverTooltipHandlers } from '../tooltips';
export interface CheckboxFieldProps {
    /** change handler */
    onChange: React.ChangeEventHandler;
    /** checkbox is checked if value is true */
    value?: boolean;
    /** classes to apply */
    className?: string;
    /** classes to apply to inner label text div. Deprecated. use labelProps.className */
    labelTextClassName?: string | null | undefined;
    /** name of field in form */
    name?: string;
    /** label text for checkbox */
    label?: string;
    /** if is included, checkbox will use error style. The content of the string is ignored. */
    error?: string | null | undefined;
    /** checkbox is disabled if value is true */
    disabled?: boolean;
    /** html tabindex property */
    tabIndex?: number;
    /** props passed into label div. TODO IMMEDIATELY what is the Flow type? */
    labelProps?: React.ComponentProps<'div'>;
    /** handlers for HoverTooltipComponent */
    hoverTooltipHandlers?: HoverTooltipHandlers;
    /** if true, render indeterminate icon */
    isIndeterminate?: boolean;
}
export declare function CheckboxField(props: CheckboxFieldProps): JSX.Element;
