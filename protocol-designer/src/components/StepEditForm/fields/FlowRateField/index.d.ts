/// <reference types="react" />
import { FlowRateInputProps } from './FlowRateInput';
import { FieldProps } from '../../types';
interface OP extends FieldProps {
    pipetteId?: string | null;
    className?: FlowRateInputProps['className'];
    flowRateType: FlowRateInputProps['flowRateType'];
    label?: FlowRateInputProps['label'];
}
export declare function FlowRateField(props: OP): JSX.Element;
export {};
