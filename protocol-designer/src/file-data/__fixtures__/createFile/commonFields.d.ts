import { LabwareLiquidState, LabwareEntities, PipetteEntities } from '@opentrons/step-generation';
import { DismissedWarningState } from '../../../dismiss/reducers';
import { IngredientsState } from '../../../labware-ingred/reducers';
import { LabwareDefByDefURI } from '../../../labware-defs';
import { FileMetadataFields } from '../../types';
export declare const fileMetadata: FileMetadataFields;
export declare const dismissedWarnings: DismissedWarningState;
export declare const ingredients: IngredientsState;
export declare const ingredLocations: LabwareLiquidState;
export declare const labwareEntities: LabwareEntities;
export declare const pipetteEntities: PipetteEntities;
export declare const labwareNicknamesById: Record<string, string>;
export declare const labwareDefsByURI: LabwareDefByDefURI;
export declare const ot2Robot: {
    model: "OT-2 Standard";
    deckId: "ot2_standard";
};
