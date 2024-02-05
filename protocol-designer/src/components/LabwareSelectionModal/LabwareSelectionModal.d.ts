import * as React from 'react';
import { LabwareDefinition2, ModuleModel } from '@opentrons/shared-data';
import type { DeckSlot } from '../../types';
import type { LabwareDefByDefURI } from '../../labware-defs';
export interface Props {
    onClose: (e?: any) => unknown;
    onUploadLabware: (event: React.ChangeEvent<HTMLInputElement>) => unknown;
    selectLabware: (containerType: string) => unknown;
    customLabwareDefs: LabwareDefByDefURI;
    /** the slot you're literally adding labware to (may be a module slot) */
    slot?: DeckSlot | null;
    /** if adding to a module, the slot of the parent (for display) */
    parentSlot?: DeckSlot | null;
    /** if adding to a module, the module's model */
    moduleModel?: ModuleModel | null;
    /** tipracks that may be added to deck (depends on pipette<>tiprack assignment) */
    permittedTipracks: string[];
    isNextToHeaterShaker: boolean;
    has96Channel: boolean;
    adapterLoadName?: string;
}
export declare const getLabwareIsRecommended: (def: LabwareDefinition2, moduleModel?: ModuleModel | null) => boolean;
export declare function LabwareSelectionModal(): JSX.Element | null;
