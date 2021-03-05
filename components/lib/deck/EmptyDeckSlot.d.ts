/// <reference types="react" />
import type { LabwareWrapperProps } from './LabwareWrapper';
export interface EmptyDeckSlotProps extends LabwareWrapperProps {
    slot: string;
}
/**
 * @deprecated Use {@link RobotWorkSpace}
 */
export declare function EmptyDeckSlot(props: EmptyDeckSlotProps): JSX.Element;
