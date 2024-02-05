/// <reference types="react" />
import { Mount } from '@opentrons/components';
import type { WizardTileProps } from './types';
export declare function FirstPipetteTipsTile(props: WizardTileProps): JSX.Element;
export declare function SecondPipetteTipsTile(props: WizardTileProps): JSX.Element | null;
interface PipetteTipsTileProps extends WizardTileProps {
    mount: Mount;
}
export declare function PipetteTipsTile(props: PipetteTipsTileProps): JSX.Element;
export {};
