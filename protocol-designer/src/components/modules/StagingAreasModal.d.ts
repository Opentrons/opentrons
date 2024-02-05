import type { AdditionalEquipmentEntity } from '@opentrons/step-generation';
export interface StagingAreasValues {
    selectedSlots: string[];
}
export interface StagingAreasModalProps {
    onCloseClick: () => void;
    stagingAreas: AdditionalEquipmentEntity[];
}
export declare const StagingAreasModal: (props: StagingAreasModalProps) => JSX.Element;
