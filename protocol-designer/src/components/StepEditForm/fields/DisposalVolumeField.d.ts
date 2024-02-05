import type { FieldPropsByName } from '../types';
import type { PathOption, StepType } from '../../../form-types';
interface DisposalVolumeFieldProps {
    path: PathOption;
    pipette: string | null;
    propsForFields: FieldPropsByName;
    stepType: StepType;
    volume: string | null;
    aspirate_airGap_checkbox?: boolean | null;
    aspirate_airGap_volume?: string | null;
}
export declare const DisposalVolumeField: (props: DisposalVolumeFieldProps) => JSX.Element;
export {};
