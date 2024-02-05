import { FieldProps } from '../../types';
/** When flow rate is falsey (including 0), it means 'use default' */
export interface FlowRateInputProps extends FieldProps {
    defaultFlowRate?: number | null;
    flowRateType: 'aspirate' | 'dispense';
    label?: string | null;
    minFlowRate: number;
    maxFlowRate: number;
    pipetteDisplayName?: string | null;
    className?: string;
}
export declare const FlowRateInput: (props: FlowRateInputProps) => JSX.Element;
