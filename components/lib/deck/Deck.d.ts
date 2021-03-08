import * as React from 'react';
import type { DeckDefinition, DeckSlotId } from '@opentrons/shared-data';
export interface LabwareComponentProps {
    slot: DeckSlotId;
    width: number;
    height: number;
}
export declare type LabwareComponentType = React.ComponentType<LabwareComponentProps>;
export interface DeckProps {
    className?: string;
    LabwareComponent?: LabwareComponentType;
    DragPreviewLayer?: React.ReactPortal;
}
/**
 * @deprecated Use {@link RobotWorkSpace}
 */
export declare class Deck extends React.Component<DeckProps> {
    parentRef: HTMLElement | SVGGElement | null | undefined;
    getXY: (rawX: number, rawY: number) => Partial<{
        scaledX?: number;
        scaledY?: number;
    }>;
    render(): JSX.Element;
}
export interface DeckFromDataProps {
    def: DeckDefinition;
    layerBlocklist: string[];
}
export declare function DeckFromData(props: DeckFromDataProps): JSX.Element;
