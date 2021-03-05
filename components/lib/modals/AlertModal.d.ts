import * as React from 'react';
import type { ButtonProps } from '../buttons';
import type { IconName } from '../icons';
export interface AlertModalProps {
    /** optional handler for overlay click */
    onCloseClick?: () => unknown;
    /** optional modal heading */
    heading?: string;
    /** optional array of `ButtonProps` for `OutlineButton`s at bottom of modal */
    buttons?: ButtonProps[];
    /** modal contents */
    children: React.ReactNode;
    /** optional classes to apply */
    className?: string;
    /** optional classes to apply */
    contentsClassName?: string;
    /** lightens overlay (alert modal over existing modal) */
    alertOverlay?: boolean;
    /** override default alert icon */
    iconName?: IconName | null | undefined;
    /** restricts scroll outside of Modal when open, true by default */
    restrictOuterScroll?: boolean;
}
/**
 * Generic alert modal with a heading and a set of buttons at the bottom
 */
export declare function AlertModal(props: AlertModalProps): JSX.Element;
