import * as React from 'react';
import { StepType } from '../form-types';
interface StepButtonComponentProps {
    children: React.ReactNode;
    expanded: boolean;
    disabled: boolean;
    setExpanded: (expanded: boolean) => void;
}
export declare const StepCreationButtonComponent: (props: StepButtonComponentProps) => JSX.Element;
export interface StepButtonItemProps {
    onClick: () => void;
    stepType: StepType;
}
export declare function StepButtonItem(props: StepButtonItemProps): JSX.Element;
export declare const StepCreationButton: () => JSX.Element;
export {};
