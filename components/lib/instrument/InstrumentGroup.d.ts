/// <reference types="react" />
import type { InstrumentInfoProps } from './InstrumentInfo';
export interface InstrumentGroupProps {
    showMountLabel?: boolean | null | undefined;
    left?: InstrumentInfoProps | null | undefined;
    right?: InstrumentInfoProps | null | undefined;
}
/**
 * Renders a left and right pipette diagram & info.
 * Takes child `InstrumentInfo` props in `right` and `left` props.
 */
export declare function InstrumentGroup(props: InstrumentGroupProps): JSX.Element;
