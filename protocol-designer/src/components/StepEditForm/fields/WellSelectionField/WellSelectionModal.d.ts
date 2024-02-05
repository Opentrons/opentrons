import * as React from 'react';
import type { StepFieldName } from '../../../../form-types';
import type { NozzleType } from '../../../../types';
interface WellSelectionModalProps {
    isOpen: boolean;
    name: StepFieldName;
    onCloseClick: (e?: React.MouseEvent<HTMLDivElement>) => unknown;
    value: unknown;
    updateValue: (val: unknown | null | undefined) => void;
    nozzleType?: NozzleType | null;
    labwareId?: string | null;
    pipetteId?: string | null;
}
export declare const WellSelectionModal: (props: WellSelectionModalProps) => JSX.Element | null;
export {};
