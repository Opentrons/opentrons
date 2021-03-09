import * as React from 'react';
import type { LabwareDefinition2 } from '@opentrons/shared-data';
import type { CSSProperties } from 'styled-components';
export interface FilledWellsProps {
    definition: LabwareDefinition2;
    fillByWell: Record<string, CSSProperties['fill']>;
}
declare function FilledWellsComponent(props: FilledWellsProps): JSX.Element;
export declare const FilledWells: React.MemoExoticComponent<typeof FilledWellsComponent>;
export {};
