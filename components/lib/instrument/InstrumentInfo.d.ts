import * as React from 'react';
import type { PipetteNameSpecs, PipetteModelSpecs } from '@opentrons/shared-data';
import type { Mount } from '../robot-types';
export interface InstrumentInfoProps {
    /** 'left' or 'right' */
    mount: Mount;
    /** if true, show labels 'LEFT PIPETTE' / 'RIGHT PIPETTE' */
    showMountLabel?: boolean | null | undefined;
    /** human-readable description, eg 'p300 Single-channel' */
    description: string;
    /** paired tiprack model */
    tiprackModel?: string;
    /** if disabled, pipette & its info are grayed out */
    isDisabled: boolean;
    /** specs of mounted pipette */
    pipetteSpecs?: PipetteModelSpecs | PipetteNameSpecs | null | undefined;
    /** classes to apply */
    className?: string;
    /** classes to apply to the info group child */
    infoClassName?: string;
    /** children to display under the info */
    children?: React.ReactNode;
}
export declare function InstrumentInfo(props: InstrumentInfoProps): JSX.Element;
