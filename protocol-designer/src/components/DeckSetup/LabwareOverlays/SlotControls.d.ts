import * as React from 'react';
import { LabwareDefByDefURI } from '../../../labware-defs';
import { TerminalItemId } from '../../../steplist';
import type { CoordinateTuple, Dimensions, ModuleType } from '@opentrons/shared-data';
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
    slotPosition: CoordinateTuple | null;
    slotBoundingBox: Dimensions;
    slotId: string;
    moduleType: ModuleType | null;
    selectedTerminalItemId?: TerminalItemId | null;
    handleDragHover?: () => unknown;
}
interface DP {
    addLabware: (e: React.MouseEvent<any>) => unknown;
    moveDeckItem: (item1: DeckSlot, item2: DeckSlot) => unknown;
}
interface SP {
    customLabwareDefs: LabwareDefByDefURI;
}
export type SlotControlsProps = OP & DP & DNDP & SP;
export declare const SlotControlsComponent: (props: SlotControlsProps) => JSX.Element | null;
export declare const SlotControls: import("react-redux").ConnectedComponent<import("react-dnd").DndComponentClass<SlotControlsProps>, {
    moduleType: ModuleType | null;
    ref?: React.LegacyRef<React.Component<SlotControlsProps, any, any>> | undefined;
    key?: React.Key | null | undefined;
    css?: import("styled-components").CSSProp | undefined;
    itemType: string;
    connectDropTarget: (val: React.ReactNode) => JSX.Element;
    isOver: boolean;
    slotPosition: CoordinateTuple | null;
    slotBoundingBox: Dimensions;
    slotId: string;
    selectedTerminalItemId?: TerminalItemId | null | undefined;
    handleDragHover?: (() => unknown) | undefined;
    draggedItem: {
        labwareOnDeck: LabwareOnDeck;
    } | null;
    context?: React.Context<import("react-redux").ReactReduxContextValue<any, import("redux").AnyAction>> | undefined;
    store?: import("redux").Store<any, import("redux").AnyAction> | undefined;
}>;
export {};
