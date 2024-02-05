type BlockedSlotMessage = 'MODULE_INCOMPATIBLE_SINGLE_LABWARE' | 'MODULE_INCOMPATIBLE_LABWARE_SWAP' | 'LABWARE_INCOMPATIBLE_WITH_ADAPTER';
interface Props {
    x: number;
    y: number;
    width: number;
    height: number;
    message: BlockedSlotMessage;
}
export declare const BlockedSlot: (props: Props) => JSX.Element;
export {};
