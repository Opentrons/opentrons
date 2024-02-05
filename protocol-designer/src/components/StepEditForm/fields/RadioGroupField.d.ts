import * as React from 'react';
import { RadioGroup } from '@opentrons/components';
import { StepFieldName } from '../../../steplist/fieldLevel';
import { FieldProps } from '../types';
interface RadioGroupFieldProps extends FieldProps {
    name: StepFieldName;
    options: React.ComponentProps<typeof RadioGroup>['options'];
    className?: string;
}
export declare const RadioGroupField: (props: RadioGroupFieldProps) => JSX.Element;
export {};
