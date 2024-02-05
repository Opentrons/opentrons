/// <reference types="react" />
import type { AdditionalEquipmentEntity } from '@opentrons/step-generation';
interface StagingAreasRowProps {
    handleAttachment: () => void;
    stagingAreas: AdditionalEquipmentEntity[];
}
export declare function StagingAreasRow(props: StagingAreasRowProps): JSX.Element;
export {};
