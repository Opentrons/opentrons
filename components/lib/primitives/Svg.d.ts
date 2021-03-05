import type { StyleProps, PrimitiveComponent } from './types';
export interface SvgProps extends StyleProps {
    /** attach a width attribute to the <svg> element */
    svgWidth?: string | number;
    /** attach a height attribute to the <svg> element */
    svgHeight?: string | number;
    /**
     * internal helper prop to remap width style-prop to CSS
     * @internal
     */
    _cssWidth?: string | number;
    /**
     * internal helper prop to remap height style-prop to CSS
     * @internal
     */
    _cssHeight?: string | number;
}
/**
 * SVG primitive
 *
 * @component
 */
export declare const Svg: PrimitiveComponent<'svg'>;
