/// <reference types="react" />
import type { AlertModalProps } from './AlertModal';
export interface ContinueModalProps extends Omit<AlertModalProps, 'buttons'> {
    onCancelClick: () => unknown;
    onContinueClick: () => unknown;
}
/**
 * AlertModal variant to prompt user to "Cancel" or "Continue" a given action
 */
export declare function ContinueModal(props: ContinueModalProps): JSX.Element;
