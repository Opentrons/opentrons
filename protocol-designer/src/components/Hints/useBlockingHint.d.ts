import * as React from 'react';
import { HintKey } from '../../tutorial';
export interface HintProps {
    hintKey: HintKey;
    handleCancel: () => void;
    handleContinue: () => void;
    content: React.ReactNode;
}
export declare const BlockingHint: (props: HintProps) => JSX.Element;
export interface HintArgs {
    /** `enabled` should be a condition that the parent uses to toggle whether the hint should be active or not.
     * If the hint is enabled but has been dismissed, it will automatically call `handleContinue` when enabled.
     * useBlockingHint expects the parent to disable the hint on cancel/continue */
    enabled: boolean;
    hintKey: HintKey;
    content: React.ReactNode;
    handleCancel: () => void;
    handleContinue: () => void;
}
export declare const useBlockingHint: (args: HintArgs) => JSX.Element | null;
