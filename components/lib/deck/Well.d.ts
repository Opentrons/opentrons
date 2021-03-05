import * as React from 'react';
import type { WellDefinition } from '@opentrons/shared-data';
export interface SingleWell {
    wellName: string;
    highlighted?: boolean | null;
    selected?: boolean | null;
    error?: boolean | null;
    maxVolume?: number;
    fillColor?: string | null;
}
export interface WellProps extends SingleWell {
    selectable?: boolean;
    wellDef: WellDefinition;
    onMouseOver?: (e: React.MouseEvent) => unknown;
    onMouseLeave?: (e: React.MouseEvent) => unknown;
    onMouseMove?: (e: React.MouseEvent) => unknown;
}
export declare class Well extends React.Component<WellProps> {
    shouldComponentUpdate(nextProps: WellProps): boolean;
    render(): JSX.Element | null;
}
