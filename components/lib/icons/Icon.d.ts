import * as React from 'react';
import { ICON_DATA_BY_NAME } from './icon-data';
import type { StyleProps } from '../primitives';
export declare type IconName = keyof typeof ICON_DATA_BY_NAME;
export interface IconProps {
    /** name constant of the icon to display */
    name: IconName;
    /** classes to apply */
    className?: string;
    /** spin the icon with a CSS animation */
    spin?: boolean;
    /** x attribute as a number or string (for nesting inside another SVG) */
    x?: number | string;
    /** y attribute as a number or string (for nesting inside another SVG) */
    y?: number | string;
    /** width as a number or string (for nesting inside another SVG) */
    svgHeight?: number | string;
    /** height as a number or string (for nesting inside another SVG) */
    svgWidth?: number | string;
    /** inline style passed into the icon svg */
    style?: Record<string, string | number>;
    /** optional children */
    children?: React.ReactNode;
}
/**
 * Inline SVG icon component
 *
 * If you need access to the IconName type, you can:
 * ```js
 * import type { IconName } from '@opentrons/components'
 * ```
 */
export declare function Icon(props: IconProps & Partial<StyleProps>): JSX.Element | null;
