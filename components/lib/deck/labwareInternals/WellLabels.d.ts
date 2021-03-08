import * as React from 'react';
import type { LabwareDefinition2 } from '@opentrons/shared-data';
export interface WellLabelsProps {
    definition: LabwareDefinition2;
}
declare function WellLabelsComponent(props: WellLabelsProps): JSX.Element;
export declare const WellLabels: React.MemoExoticComponent<typeof WellLabelsComponent>;
export {};
