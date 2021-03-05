import * as React from 'react';
export interface ModalProps {
    /** handler to close the modal (attached to `Overlay` onClick) */
    onCloseClick?: React.MouseEventHandler;
    /** Optional styled heading **/
    heading?: string;
    /** modal contents */
    children: React.ReactNode;
    /** classes to apply */
    className?: string;
    /** classes to apply to the contents box */
    contentsClassName?: string;
    /** lightens overlay (alert modal over existing modal) */
    alertOverlay?: boolean;
    /** restricts scroll outside of Modal when open, true by default */
    restrictOuterScroll?: boolean;
    innerRef?: {
        current: HTMLElement | null;
    } | ((current: HTMLElement | null) => unknown);
}
/**
 * Base modal component that fills its nearest `display:relative` ancestor
 * with a dark overlay and displays `children` as its contents in a white box
 */
export declare function Modal(props: ModalProps): JSX.Element;
