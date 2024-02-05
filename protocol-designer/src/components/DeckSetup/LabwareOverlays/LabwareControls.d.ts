import { TerminalItemId } from '../../../steplist';
import { LabwareOnDeck } from '../../../step-forms';
import type { CoordinateTuple } from '@opentrons/shared-data';
interface LabwareControlsProps {
    labwareOnDeck: LabwareOnDeck;
    slotPosition: CoordinateTuple;
    setHoveredLabware: (labware?: LabwareOnDeck | null) => unknown;
    setDraggedLabware: (labware?: LabwareOnDeck | null) => unknown;
    swapBlocked: boolean;
    selectedTerminalItemId?: TerminalItemId | null;
}
export declare const LabwareControls: (props: LabwareControlsProps) => JSX.Element;
export {};
