import * as React from 'react';
import { BUTTON_TYPE_SUBMIT, BUTTON_TYPE_RESET, BUTTON_TYPE_BUTTON } from '../primitives';
import type { IconName } from '../icons';
interface HoverTooltipHandlers {
    ref: React.Ref<Element>;
    'aria-describedby': string;
    onMouseEnter: () => unknown;
    onMouseLeave: () => unknown;
    onPointerEnter: () => unknown;
    onPointerLeave: () => unknown;
}
export interface ButtonProps {
    /** click handler */
    onClick?: (event: React.MouseEvent) => unknown;
    /** name attribute */
    name?: string;
    /** title attribute */
    title?: string;
    /** disabled attribute (setting disabled removes onClick) */
    disabled?: boolean | null | undefined;
    /** use hover style even when not hovered */
    hover?: boolean | null | undefined;
    /** optional Icon name */
    iconName?: IconName;
    /** classes to apply */
    className?: string;
    /** inverts the default color/background/border of default button style */
    inverted?: boolean;
    /** contents of the button */
    children?: React.ReactNode;
    /** type of button (default "button") */
    type?: typeof BUTTON_TYPE_SUBMIT | typeof BUTTON_TYPE_RESET | typeof BUTTON_TYPE_BUTTON;
    /** ID of form that button is for */
    form?: string;
    /** custom element or component to use instead of `<button>` */
    Component?: React.ReactComponentElement<any>;
    /** handlers for HoverTooltipComponent */
    hoverTooltipHandlers?: Partial<HoverTooltipHandlers> | null | undefined;
    /** html tabindex property */
    tabIndex?: number;
}
/**
 * Basic, un-styled button. You probably want to use a styled button
 * instead. All buttons take the same props.
 *
 * If you need access to the ButtonProps type, you can:
 * ```js
 * import {type ButtonProps} from '@opentrons/components'
 * ```
 */
export declare function Button(props: ButtonProps): JSX.Element;
export {};
