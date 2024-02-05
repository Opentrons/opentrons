import * as React from 'react';
import { DeckSlot } from '../../../types';
import { LabwareOnDeck } from '../../../step-forms';
interface OP {
    labwareOnDeck: LabwareOnDeck;
    setHoveredLabware: (val?: LabwareOnDeck | null) => unknown;
    setDraggedLabware: (val?: LabwareOnDeck | null) => unknown;
    swapBlocked: boolean;
}
interface SP {
    isYetUnnamed: boolean;
}
interface DP {
    editLiquids: () => unknown;
    duplicateLabware: () => unknown;
    deleteLabware: () => unknown;
    moveDeckItem: (item1: DeckSlot, item2: DeckSlot) => unknown;
}
interface DNDP {
    draggedLabware?: LabwareOnDeck | null;
    isOver: boolean;
    connectDragSource: (val: JSX.Element) => JSX.Element;
    connectDropTarget: (val: JSX.Element) => JSX.Element;
}
type Props = OP & SP & DP & DNDP;
export declare const EditLabware: import("react-redux").ConnectedComponent<import("react-dnd").DndComponentClass<Props>, {
    ref?: React.LegacyRef<React.Component<Props, any, any>> | undefined;
    key?: React.Key | null | undefined;
    css?: import("styled-components").CSSProp | undefined;
    connectDragSource: (val: JSX.Element) => JSX.Element;
    connectDropTarget: (val: JSX.Element) => JSX.Element;
    isOver: boolean;
    labwareOnDeck: import("@opentrons/step-generation").LabwareEntity & import("../../../step-forms").LabwareTemporalProperties;
    setHoveredLabware: (val?: LabwareOnDeck | null) => unknown;
    setDraggedLabware: (val?: LabwareOnDeck | null) => unknown;
    swapBlocked: boolean;
    draggedLabware?: LabwareOnDeck | null | undefined;
    context?: React.Context<import("react-redux").ReactReduxContextValue<any, import("redux").AnyAction>> | undefined;
    store?: import("redux").Store<any, import("redux").AnyAction> | undefined;
}>;
export {};
