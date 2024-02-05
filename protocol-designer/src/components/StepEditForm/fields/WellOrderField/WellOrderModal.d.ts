import type { WellOrderOption } from '../../../../form-types';
export interface WellOrderModalProps {
    isOpen: boolean;
    closeModal: () => unknown;
    prefix: 'aspirate' | 'dispense' | 'mix';
    firstValue?: WellOrderOption | null;
    secondValue?: WellOrderOption | null;
    firstName: string;
    secondName: string;
    updateValues: (firstValue?: WellOrderOption | null, secondValue?: WellOrderOption | null) => void;
}
export declare const ResetButton: (props: {
    onClick: () => void;
}) => JSX.Element;
export declare const CancelButton: (props: {
    onClick: () => void;
}) => JSX.Element;
export declare const DoneButton: (props: {
    onClick: () => void;
}) => JSX.Element;
export declare const WellOrderModal: (props: WellOrderModalProps) => JSX.Element | null;
