import { DropdownOption } from '@opentrons/components';
export interface TrashValues {
    selectedSlot: string;
}
export declare const MOVABLE_TRASH_CUTOUTS: DropdownOption[];
export interface TrashModalProps {
    onCloseClick: () => void;
    trashName: 'wasteChute' | 'trashBin';
    trashBinId?: string;
}
export declare const TrashModal: (props: TrashModalProps) => JSX.Element;
