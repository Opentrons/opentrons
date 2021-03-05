import * as React from 'react';
import type { HoverTooltipHandlers } from '../tooltips';
export interface FormGroupProps {
    /** text label */
    label?: string;
    /** form content */
    children?: React.ReactNode;
    /** classes to apply */
    className?: string | null | undefined;
    /** if is included, FormGroup title will use error style. The content of the string is ignored. */
    error?: string | null | undefined;
    /** enable disabled style. Overridden by truthy `error` */
    disabled?: boolean | null | undefined;
    /** handlers for HoverTooltipComponent */
    hoverTooltipHandlers?: HoverTooltipHandlers | null | undefined;
}
export declare function FormGroup(props: FormGroupProps): JSX.Element;
