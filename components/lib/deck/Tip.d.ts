/// <reference types="react" />
import type { WellDefinition } from '@opentrons/shared-data';
export interface TipProps {
    wellDef: WellDefinition;
    tipVolume: number | null | undefined;
    empty?: boolean | null | undefined;
    highlighted?: boolean | null | undefined;
}
export declare function Tip(props: TipProps): JSX.Element;
