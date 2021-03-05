export interface UseHoverOptions {
    enterDelay?: number;
    leaveDelay?: number;
}
export interface HoverHandlers {
    onPointerEnter: () => unknown;
    onPointerLeave: () => unknown;
}
export declare type UseHoverResult = [boolean, HoverHandlers];
/**
 * Hook to track hover state of an element
 *
 * @param {UseHoverOptions} [options={}] (add an `enterDelay` or `leaveDelay` to the hover state change)
 * @returns {UseHoverResult}
 * @example
 * ```js
 * import { useHover } from '@opentrons/components'
 *
 * export function HoverComponent() {
 *   const [hovered, hoverHandlers] = useHover({
 *     enterDelay: 300,
 *     leaveDelay: 100
 *   })
 *
 *   return (
 *     <span {...hoverHandlers}>
 *       {hovered ? 'Hovered!' : 'Not hovered!'}
 *     </span>
 *   )
 * }
 * ```
 */
export declare function useHover(options?: UseHoverOptions): UseHoverResult;
