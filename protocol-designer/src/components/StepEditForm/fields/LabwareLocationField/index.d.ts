import * as React from 'react';
import { StepFormDropdown } from '../StepFormDropdownField';
export declare function LabwareLocationField(props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'> & {
    useGripper: boolean;
} & {
    canSave: boolean;
} & {
    labware: string;
}): JSX.Element;
