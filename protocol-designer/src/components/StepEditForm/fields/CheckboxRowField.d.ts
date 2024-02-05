import * as React from 'react';
import { FieldProps } from '../types';
import type { Placement } from '@opentrons/components';
type CheckboxRowProps = FieldProps & {
    children?: React.ReactNode;
    className?: string;
    label?: string;
    tooltipContent?: React.ReactNode;
    tooltipPlacement?: Placement;
};
export declare const CheckboxRowField: (props: CheckboxRowProps) => JSX.Element;
export {};
