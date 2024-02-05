import { Options } from '@opentrons/components';
import { StepFieldName } from '../../../steplist/fieldLevel';
import type { FieldProps } from '../types';
export interface StepFormDropdownProps extends FieldProps {
    options: Options;
    name: StepFieldName;
    className?: string;
}
export declare const StepFormDropdown: (props: StepFormDropdownProps) => JSX.Element;
