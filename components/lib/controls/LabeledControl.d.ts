import * as React from 'react';
export interface LabeledControlProps {
    label: string;
    control: React.ReactNode;
    children?: React.ReactNode;
}
export declare function LabeledControl(props: LabeledControlProps): JSX.Element;
