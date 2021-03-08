import * as React from 'react';
import { Popper } from 'react-popper';
declare type PopperProps = React.ComponentProps<typeof Popper>;
export interface DeprecatedTooltipProps {
    /** show or hide the tooltip */
    open?: boolean;
    /** contents of the tooltip */
    tooltipComponent: JSX.Element | unknown;
    /** optional portal to place the tooltipComponent inside */
    portal?: React.ComponentType<any>;
    /** <https://github.com/FezVrasta/react-popper#placement> */
    placement?: PopperProps['placement'];
    /** <https://github.com/FezVrasta/react-popper#positionfixed> */
    positionFixed?: PopperProps['positionFixed'];
    /** <https://github.com/FezVrasta/react-popper#modifiers> */
    modifiers?: PopperProps['modifiers'];
    /** render function for tooltip'd component */
    children: (props?: React.PropsWithRef<any>) => JSX.Element | null;
    /** extra props to pass to the children render function */
    childProps?: React.PropsWithRef<any>;
}
/**
 *  Basic, fully controlled Tooltip component.
 *
 * `props.children` is a function that receives the following props object:
 * ```js
 * type TooltipChildProps = {
 *   ref: React.Ref<*>,
 * }
 * ```
 *
 * `props.childProps` can be used to add extra fields to the child props object
 *
 * @deprecated Use `Tooltip` and `useTooltip` instead
 */
export declare function DeprecatedTooltip(props: DeprecatedTooltipProps): JSX.Element | null;
export {};
