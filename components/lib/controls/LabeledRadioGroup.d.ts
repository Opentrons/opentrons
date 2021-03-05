import * as React from 'react';
import type { RadioGroupProps } from '../forms';
export interface LabeledRadioGroupProps extends RadioGroupProps {
    label: string;
    children: React.ReactNode;
    'data-test'?: string;
}
export declare function LabeledRadioGroup(props: LabeledRadioGroupProps): JSX.Element;
