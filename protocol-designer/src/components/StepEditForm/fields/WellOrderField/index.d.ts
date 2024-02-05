import { FieldProps } from '../../types';
import { WellOrderOption } from '../../../../form-types';
export interface WellOrderFieldProps {
    className?: string | null;
    label?: string;
    prefix: 'aspirate' | 'dispense' | 'mix';
    firstValue?: WellOrderOption | null;
    secondValue?: WellOrderOption | null;
    firstName: string;
    secondName: string;
    updateFirstWellOrder: FieldProps['updateValue'];
    updateSecondWellOrder: FieldProps['updateValue'];
}
export declare const WellOrderField: (props: WellOrderFieldProps) => JSX.Element;
