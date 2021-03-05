/// <reference types="react" />
import type { LabwareDefinition2 } from '@opentrons/shared-data';
import type { WellMouseEvent, WellFill, WellGroup } from './labwareInternals/types';
export interface LabwareRenderProps {
    definition: LabwareDefinition2;
    showLabels?: boolean;
    missingTips?: WellGroup | null | undefined;
    highlightedWells?: WellGroup | null | undefined;
    selectedWells?: WellGroup | null | undefined;
    /** CSS color to fill specified wells */
    wellFill?: WellFill;
    /** Optional callback, called with WellMouseEvent args onMouseEnter */
    onMouseEnterWell?: (e: WellMouseEvent) => unknown;
    /** Optional callback, called with WellMouseEvent args onMouseLeave */
    onMouseLeaveWell?: (e: WellMouseEvent) => unknown;
    /** Special class which, together with 'data-wellname' on the well elements,
      allows drag-to-select behavior */
    selectableWellClass?: string;
}
export declare function LabwareRender(props: LabwareRenderProps): JSX.Element;
