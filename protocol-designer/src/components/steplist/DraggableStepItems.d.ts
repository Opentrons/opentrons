import * as React from 'react';
import { StepIdType } from '../../form-types';
interface StepItemsProps {
    orderedStepIds: StepIdType[];
    reorderSteps: (steps: StepIdType[]) => unknown;
    isOver: boolean;
    connectDropTarget: (val: unknown) => React.ReactElement<any>;
}
type DraggableStepItemProps = Omit<StepItemsProps, 'isOver' | 'connectDropTarget'>;
export declare const StepDragPreviewLayer: import("react-dnd").DndComponentClass<unknown>;
export declare const DraggableStepItems: import("react-dnd").DndComponentClass<DraggableStepItemProps>;
export {};
