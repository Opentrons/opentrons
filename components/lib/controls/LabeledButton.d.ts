import * as React from 'react';
import type { ButtonProps } from '../buttons';
export interface LabeledButtonProps {
    label: string;
    buttonProps: ButtonProps;
    children: React.ReactNode;
}
export declare function LabeledButton(props: LabeledButtonProps): JSX.Element;
