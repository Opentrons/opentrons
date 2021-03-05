import * as React from 'react';
export interface LabeledCheckboxProps {
    label: string;
    name: string;
    value: boolean;
    className?: string;
    children: React.ReactNode;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}
export declare function LabeledCheckbox(props: LabeledCheckboxProps): JSX.Element;
