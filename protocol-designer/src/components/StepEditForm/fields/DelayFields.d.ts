import { FieldPropsByName } from '../types';
import { StepFieldName } from '../../../form-types';
export interface DelayFieldProps {
    checkboxFieldName: StepFieldName;
    labwareId?: string | null;
    propsForFields: FieldPropsByName;
    secondsFieldName: StepFieldName;
    tipPositionFieldName?: StepFieldName;
}
export declare const DelayFields: (props: DelayFieldProps) => JSX.Element;
