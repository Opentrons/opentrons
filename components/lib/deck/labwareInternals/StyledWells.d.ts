import * as React from 'react';
import type { LabwareDefinition2 } from '@opentrons/shared-data';
import type { WellGroup } from './types';
export interface StyledWellProps {
    className: string;
    definition: LabwareDefinition2;
    wells: WellGroup;
}
export declare const StyledWells: React.AbstractComponent<StyledWellProps>;
