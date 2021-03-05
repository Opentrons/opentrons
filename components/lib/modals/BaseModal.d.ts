import * as React from 'react';
import type { StyleProps } from '../primitives';
export interface BaseModalProps extends StyleProps {
    /** Overlay color, defaults to `OVERLAY_GRAY_90` */
    overlayColor?: string;
    /** Optional sticky header */
    header?: JSX.Element;
    /** Optional sticky footer */
    footer?: JSX.Element;
    /** Modal content */
    children?: React.ReactNode;
}
/**
 * A BaseModal is a layout component for building more specific modals.
 *
 * It includes:
 * - An overlay, customizable with the `overlayColor` prop
 * - A content area, with `overflow-y: auto` and customizable with style props
 * - An optional sticky header
 * - An optional sticky footer
 */
export declare function BaseModal(props: BaseModalProps): JSX.Element;
