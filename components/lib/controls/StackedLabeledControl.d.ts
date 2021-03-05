import * as React from 'react';
export interface StackedLabeledControlProps {
    label: string;
    control: React.ReactNode;
    children?: React.ReactNode;
}
export declare function StackedLabeledControl(props: StackedLabeledControlProps): JSX.Element;
