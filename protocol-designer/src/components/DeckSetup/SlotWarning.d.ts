import type { ModuleOrientation } from '@opentrons/shared-data';
interface Props {
    x: number;
    y: number;
    xDimension: number;
    yDimension: number;
    orientation: ModuleOrientation;
    warningType: 'gen1multichannel';
}
export declare const SlotWarning: (props: Props) => JSX.Element;
export {};
