import { LabwareOnDeck as LabwareOnDeckType } from '../../../step-forms';
import { RobotWorkSpaceRenderProps } from '@opentrons/components';
interface DragPreviewProps {
    isDragging: boolean;
    currentOffset?: {
        x: number;
        y: number;
    };
    item: {
        labwareOnDeck: LabwareOnDeckType;
    };
    itemType: string;
    getRobotCoordsFromDOMCoords: RobotWorkSpaceRenderProps['getRobotCoordsFromDOMCoords'];
}
export declare const DragPreview: import("react-dnd").DndComponentClass<Omit<DragPreviewProps, "itemType" | "isDragging" | "currentOffset" | "item">>;
export {};
