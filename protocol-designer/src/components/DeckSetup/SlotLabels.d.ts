import type { RobotType } from '@opentrons/shared-data';
interface SlotLabelsProps {
    robotType: RobotType;
    hasStagingAreas: boolean;
    hasWasteChute: boolean;
}
/**
 * This is an almost copy of SlotLabels in @opentrons/components
 * in order to keep the changes between PD and the rest
 * of the repo separate
 */
export declare const SlotLabels: ({ robotType, hasStagingAreas, hasWasteChute, }: SlotLabelsProps) => JSX.Element | null;
export {};
