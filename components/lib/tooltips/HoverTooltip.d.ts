/// <reference types="node" />
import * as React from 'react';
import type { DeprecatedTooltipProps } from './DeprecatedTooltip';
interface MouseHandlers {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}
export declare type HoverTooltipHandlers = React.PropsWithRef<MouseHandlers>;
export declare type HoverTooltipProps = DeprecatedTooltipProps;
interface HoverTooltipState {
    isOpen: boolean;
}
/**
 * Tooltip component that triggers on `MouseEnter` and `MouseLeave`. See
 * `Tooltip` for full props list.
 *
 * `props.children` is a function that receives the following props object:
 * ```js
 * type HoverTooltipHandlers = {
 *   ref: React.Ref<*>,
 *   onMouseEnter: (React.MouseEvent) => void,
 *   onMouseLeave: (React.MouseEvent) => void,
 * }
 * ```
 *
 * @deprecated Use `Tooltip` and `useHoverTooltip` instead
 */
export declare class HoverTooltip extends React.Component<HoverTooltipProps, HoverTooltipState> {
    openTimeout: NodeJS.Timeout | null;
    closeTimeout: NodeJS.Timeout | null;
    constructor(props: HoverTooltipProps);
    componentWillUnmount(): void;
    delayedOpen: () => void;
    delayedClose: () => void;
    render(): JSX.Element;
}
export {};
