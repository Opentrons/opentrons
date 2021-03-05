/// <reference types="react" />
import type { Instance as PopperInstance, Options as PopperOptions } from '@popperjs/core/lib/types';
import type { UseHoverOptions, HoverHandlers } from '../interaction-enhancers';
export declare type Placement = PopperOptions['placement'];
export declare type Strategy = PopperOptions['strategy'];
export type { PopperInstance, PopperOptions };
export declare type HandleStateUpdate = (placement: Placement, styles: {
    popper?: Partial<CSSStyleDeclaration>;
    arrow?: Partial<CSSStyleDeclaration>;
}) => void;
export interface UsePopperOptions {
    target: HTMLElement | null;
    tooltip: HTMLElement | null;
    arrow: HTMLElement | null;
    onStateUpdate: HandleStateUpdate;
    placement?: Placement | null;
    strategy?: Strategy | null;
    offset?: number;
}
export declare type UsePopperResult = PopperInstance | null;
export interface UseTooltipOptions {
    placement?: Placement;
    strategy?: Strategy;
    offset?: number;
}
export interface UseTooltipResultTargetProps {
    ref: React.RefCallback<HTMLElement | null>;
    'aria-describedby': string;
}
export interface UseTooltipResultTooltipProps {
    id: string;
    ref: React.RefCallback<HTMLElement | null>;
    placement: Placement | null;
    style: Partial<CSSStyleDeclaration>;
    arrowRef: React.RefCallback<HTMLElement | null>;
    arrowStyle: Partial<CSSStyleDeclaration>;
}
export declare type UseTooltipResult = [
    UseTooltipResultTargetProps,
    UseTooltipResultTooltipProps
];
export declare type UseHoverTooltipOptions = Partial<UseTooltipOptions & UseHoverOptions>;
export declare type UseHoverTooltipTargetProps = UseTooltipResultTargetProps & HoverHandlers;
export declare type UseHoverTooltipResult = [
    UseHoverTooltipTargetProps,
    Partial<UseTooltipResultTooltipProps & {
        visible: boolean;
    }>
];
