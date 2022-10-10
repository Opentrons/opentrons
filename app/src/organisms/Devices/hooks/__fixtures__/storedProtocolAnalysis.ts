import { storedProtocolData } from '../../../../redux/protocol-storage/__fixtures__'

import type {
  LoadedLabwareById,
  LoadedLabwareDefinitionsById,
  ModuleModelsById,
  PipetteNamesById,
} from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { StoredProtocolAnalysis } from '../useStoredProtocolAnalysis'

export const LABWARE_BY_ID: LoadedLabwareById = {
  id: 'labware-0',
  loadName: 'fakeLoadName',
  definitionUri: 'fakeLabwareDefinitionUri',
  displayName: 'a fake labware',
}
export const LABWARE_DEFINITIONS: LoadedLabwareDefinitionsById = {
  fakeLabwareDefinitionId: {} as LabwareDefinition2,
}
export const MODULE_MODELS_BY_ID: ModuleModelsById = {
  'module-0': { model: 'thermocyclerModuleV1' },
}
export const PIPETTE_NAME_BY_ID: PipetteNamesById = {
  id: 'pipette-0',
  pipetteName: 'p10_single',
}

export const STORED_PROTOCOL_ANALYSIS = {
  ...storedProtocolData.mostRecentAnalysis,
  modules: MODULE_MODELS_BY_ID,
  labware: [LABWARE_BY_ID],
  labwareDefinitions: LABWARE_DEFINITIONS,
  pipettes: [PIPETTE_NAME_BY_ID],
} as StoredProtocolAnalysis
