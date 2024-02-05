import { StepFieldName } from '../../../../form-types';
interface Props {
    closeModal: () => unknown;
    isIndeterminate?: boolean;
    mmFromBottom: number | null;
    name: StepFieldName;
    updateValue: (val: number | null | undefined) => unknown;
    wellDepthMm: number;
}
export declare const TipPositionModal: (props: Props) => JSX.Element;
export {};
