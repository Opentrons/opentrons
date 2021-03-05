import * as React from 'react';
import type { UseHoverTooltipResult } from '../tooltips';
export interface PillProps {
    /** background color of pill (any CSS color string) */
    color?: string | null | undefined;
    /** text black, instead of default white */
    invertTextColor?: boolean | null | undefined;
    /** additional class name */
    className?: string;
    /** contents of the pill */
    children?: React.ReactNode;
    /** handlers for HoverTooltipComponent */
    hoverTooltipHandlers?: React.ElementType<UseHoverTooltipResult> | null | undefined;
}
/**
 * Colored Pill containing text or other contents
 */
export declare function Pill(props: PillProps): JSX.Element;
