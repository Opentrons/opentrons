import * as React from 'react';
interface WizardHeaderProps {
    title: string;
    onExit?: React.MouseEventHandler | null;
    totalSteps?: number;
    currentStep?: number | null;
    exitDisabled?: boolean;
}
export declare const WizardHeader: (props: WizardHeaderProps) => JSX.Element;
export {};
