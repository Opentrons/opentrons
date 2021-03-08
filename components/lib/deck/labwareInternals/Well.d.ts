import * as React from 'react';
import type { LabwareWell } from '@opentrons/shared-data';
import type { WellMouseEvent } from './types';
export interface WellProps {
    /** if included, overrides the default classname */
    className?: string | null;
    /** fill inline style */
    fill?: string | null;
    /** Well Name (eg 'A1') */
    wellName: string;
    /** well object from labware definition */
    well: LabwareWell;
    /** special class used for drag-to-select functionality. Should not be used for styling */
    selectableWellClass?: string;
    /** Optional callback, called with WellMouseEvent args onMouseOver */
    onMouseEnterWell?: (e: WellMouseEvent) => unknown;
    onMouseLeaveWell?: (e: WellMouseEvent) => unknown;
}
declare function WellComponent(props: WellProps): JSX.Element | null;
export declare const Well: React.MemoExoticComponent<typeof WellComponent>;
export {};
