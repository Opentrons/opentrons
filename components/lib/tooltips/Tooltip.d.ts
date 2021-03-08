import * as React from 'react';
import type { CSSProperties } from 'react';
import type { Placement } from './types';
export interface TooltipProps {
    /** Whether or not the tooltip should be rendered */
    visible: boolean;
    /** Contents of the tooltip */
    children?: React.ReactNode;
    /**
     * Tooltip element ID (provided by useTooltip). Will match
     * targetProps.aria-describedby
     */
    id: string;
    /** Actual tooltip placement, if known (provided by useTooltip) */
    placement: Placement | null;
    /** Inline styles to apply to the tooltip element (provided by useTooltip) */
    style: CSSProperties;
    /** React function ref for tooltip's arrow element (provided by useTooltip) */
    arrowRef: React.RefCallback<HTMLElement | null>;
    /** Inline styles to apply to arrow element (provided by useTooltip) */
    arrowStyle: CSSProperties;
}
/**
 * Tooltip component that renders based on its `visible` prop. For use with the
 * `useTooltip` and `useHoverTooltip` hooks. See examples in `Tooltip.md`.
 */
export declare const Tooltip: React.ForwardRefExoticComponent<TooltipProps & React.RefAttributes<HTMLDivElement>>;
export interface ArrowProps {
    placement: Placement | null;
    arrowRef: React.RefCallback<HTMLElement>;
    arrowStyle: CSSProperties;
}
export declare function Arrow(props: ArrowProps): JSX.Element;
