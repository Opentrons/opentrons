import { RobotType } from '@opentrons/shared-data';
interface ConnectedSlotMapProps {
    fieldName: string;
    robotType: RobotType;
    isModal?: boolean;
}
export declare const ConnectedSlotMap: (props: ConnectedSlotMapProps) => JSX.Element | null;
export {};
