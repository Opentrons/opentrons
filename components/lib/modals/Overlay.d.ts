import * as React from 'react';
export interface OverlayProps {
    /** optional onClick handler */
    onClick?: React.MouseEventHandler;
    alertOverlay?: boolean | null | undefined;
}
/**
 * Dark, semi-transparent overlay for the background of a modal. If you need
 * to make a custom modal component, use `<Overlay>`, otherwise you might
 * just want to use `<Modal>`
 */
export declare function Overlay(props: OverlayProps): JSX.Element;
