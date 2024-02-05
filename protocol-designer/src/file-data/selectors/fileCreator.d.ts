import { LabwareDefByDefURI } from '../../labware-defs';
import { LabwareEntities, PipetteEntities } from '@opentrons/step-generation';
import type { ProtocolFile } from '@opentrons/shared-data';
import type { Selector } from '../../types';
export declare const getLabwareDefinitionsInUse: (labware: LabwareEntities, pipettes: PipetteEntities, allLabwareDefsByURI: LabwareDefByDefURI) => LabwareDefByDefURI;
export declare const createFile: Selector<ProtocolFile>;
