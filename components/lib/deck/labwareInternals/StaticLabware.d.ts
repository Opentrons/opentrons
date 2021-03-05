import * as React from 'react';
import type { LabwareDefinition2 } from '@opentrons/shared-data';
import type { WellMouseEvent } from './types';
export interface StaticLabwareProps {
    definition: LabwareDefinition2;
    selectableWellClass?: string;
    onMouseEnterWell?: (e: WellMouseEvent) => unknown;
    onMouseLeaveWell?: (e: WellMouseEvent) => unknown;
}
export declare const StaticLabware: React.AbstractComponent<StaticLabwareProps>;
