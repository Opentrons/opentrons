import { StepType } from '../../../form-types';
import { FieldProps } from '../types';
type Props = FieldProps & {
    stepType: StepType;
    label: string;
    className: string;
};
export declare const VolumeField: (props: Props) => JSX.Element;
export {};
