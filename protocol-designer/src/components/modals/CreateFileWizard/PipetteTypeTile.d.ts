/// <reference types="react" />
import { Mount } from '@opentrons/components';
import type { WizardTileProps } from './types';
export declare function FirstPipetteTypeTile(props: Omit<PipetteTypeTileProps, 'mount' | 'allowNoPipette' | 'display96Channel' | 'tileHeader'>): JSX.Element;
export declare function SecondPipetteTypeTile(props: Omit<PipetteTypeTileProps, 'mount' | 'allowNoPipette' | 'display96Channel' | 'tileHeader'>): JSX.Element | null;
interface PipetteTypeTileProps extends WizardTileProps {
    mount: Mount;
    allowNoPipette: boolean;
    display96Channel: boolean;
    tileHeader: string;
}
export declare function PipetteTypeTile(props: PipetteTypeTileProps): JSX.Element;
export {};
