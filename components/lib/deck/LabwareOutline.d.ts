/// <reference types="react" />
import type { LabwareDefinition2 } from '@opentrons/shared-data';
export interface LabwareOutlineProps {
    definition?: LabwareDefinition2;
    width?: number;
    height?: number;
    isTiprack?: boolean;
}
export declare function LabwareOutline(props: LabwareOutlineProps): JSX.Element;
