/// <reference types="react" />
interface AdditionalItemsRowProps {
    handleAttachment: () => void;
    isEquipmentAdded: boolean;
    name: 'gripper' | 'wasteChute' | 'trashBin';
    hasWasteChute?: boolean;
    trashBinSlot?: string;
    trashBinId?: string;
}
export declare function AdditionalItemsRow(props: AdditionalItemsRowProps): JSX.Element;
export {};
