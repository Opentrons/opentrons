/// <reference types="react" />
export interface SpinnerModalProps {
    /** Additional/Override style */
    contentsClassName?: string;
    /** Optional message to display as italic text below spinner */
    message?: string;
    /** lightens overlay (alert modal over existing modal) */
    alertOverlay?: boolean;
}
/**
 * Spinner Modal with no background and optional message
 */
export declare function SpinnerModal(props: SpinnerModalProps): JSX.Element;
