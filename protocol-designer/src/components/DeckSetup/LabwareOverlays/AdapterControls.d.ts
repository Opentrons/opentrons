import * as React from 'react';
import { LabwareDefByDefURI } from '../../../labware-defs';
import { TerminalItemId } from '../../../steplist';
import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data';
import type { DeckSlot } from '../../../types';
import type { LabwareOnDeck } from '../../../step-forms';
interface DNDP {
    isOver: boolean;
    connectDropTarget: (val: React.ReactNode) => JSX.Element;
    draggedItem: {
        labwareOnDeck: LabwareOnDeck;
    } | null;
    itemType: string;
}
interface OP {
    slotPosition: CoordinateTuple;
    slotBoundingBox: Dimensions;
    labwareId: string;
    allLabware: LabwareOnDeck[];
    onDeck: boolean;
    selectedTerminalItemId?: TerminalItemId | null;
    handleDragHover?: () => unknown;
}
interface DP {
    addLabware: (e: React.MouseEvent<any>) => unknown;
    moveDeckItem: (item1: DeckSlot, item2: DeckSlot) => unknown;
    deleteLabware: () => void;
}
interface SP {
    customLabwareDefs: LabwareDefByDefURI;
}
export type SlotControlsProps = OP & DP & DNDP & SP;
export declare const AdapterControlsComponents: (props: SlotControlsProps) => JSX.Element | null;
export declare const AdapterControls: import("react-redux").ConnectedComponent<import("react-dnd").DndComponentClass<SlotControlsProps>, {
    labwareId: string;
    ref?: React.LegacyRef<React.Component<SlotControlsProps, any, any>> | undefined;
    key?: React.Key | null | undefined;
    css?: import("styled-components").CSSProp | undefined;
    itemType: string;
    connectDropTarget: (val: React.ReactNode) => JSX.Element;
    isOver: boolean;
    slotPosition: CoordinateTuple;
    slotBoundingBox: Dimensions;
    selectedTerminalItemId?: TerminalItemId | null | undefined;
    handleDragHover?: (() => unknown) | undefined;
    draggedItem: {
        labwareOnDeck: LabwareOnDeck;
    } | null;
    allLabware: LabwareOnDeck[];
    onDeck: boolean;
    context?: React.Context<import("react-redux").ReactReduxContextValue<any, import("redux").AnyAction>> | undefined;
    store?: import("redux").Store<any, import("redux").AnyAction> | undefined;
}>;
export {};
