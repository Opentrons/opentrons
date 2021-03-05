/// <reference types="react" />
import type { PipetteNameSpecs, PipetteModelSpecs } from '@opentrons/shared-data';
import type { Mount } from '../robot-types';
export interface InstrumentDiagramProps {
    pipetteSpecs?: PipetteNameSpecs | PipetteModelSpecs | null;
    className?: string;
    mount: Mount;
}
export declare function InstrumentDiagram(props: InstrumentDiagramProps): JSX.Element;
