import * as React from 'react';
export interface LabeledCheckboxProps {
    label: string;
    name: string;
    value: boolean;
    className?: string;
    children: React.ReactNode;
    onChange: (event: React.SyntheticEvent<HTMLInputElement>) => unknown;
}
export declare function LabeledCheckbox(props: LabeledCheckboxProps): JSX.Element;
