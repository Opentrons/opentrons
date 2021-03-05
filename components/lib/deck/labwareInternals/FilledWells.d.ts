import * as React from 'react';
import type { LabwareDefinition2 } from '@opentrons/shared-data';
export interface FilledWellsProps {
    definition: LabwareDefinition2;
    fillByWell: {
        [wellName: string]: string;
    };
}
declare function FilledWellsComponent(props: FilledWellsProps): JSX.Element;
export declare const FilledWells: React.MemoExoticComponent<typeof FilledWellsComponent>;
export {};
