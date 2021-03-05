import * as React from 'react';
import type { DropdownFieldProps } from '../forms';
export interface LabeledSelectProps extends DropdownFieldProps {
    label: string;
    children: React.ReactNode;
    /** optional data test id for the container */
    'data-test'?: string;
}
export declare function LabeledSelect(props: LabeledSelectProps): JSX.Element;
