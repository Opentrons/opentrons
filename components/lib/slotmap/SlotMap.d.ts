/// <reference types="react" />
export interface SlotMapProps {
    /** Slot(s) to highlight */
    occupiedSlots: string[];
    /** Optional collision warning */
    collisionSlots?: string[];
    /** Optional error styling */
    isError?: boolean;
}
export declare function SlotMap(props: SlotMapProps): JSX.Element;
