/// <reference types="react" />
import type { ModuleModel, DeckSlot } from '@opentrons/shared-data';
export interface ModuleProps {
    /** module model */
    model: ModuleModel;
    /** display mode: 'default', 'present', 'missing', or 'info' */
    mode: 'default' | 'present' | 'missing' | 'info';
    /** slot details of the location of this module */
    slot: DeckSlot;
}
export declare function Module(props: ModuleProps): JSX.Element;
