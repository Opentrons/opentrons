import { storedProtocolData } from '../../../../redux/protocol-storage/__fixtures__'

import type {
  LoadedLabware,
  LoadedModule,
  LoadedPipette,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

export const LABWARE_ENTITY: LoadedLabware = {
  id: 'labware-0',
  loadName: 'fakeLoadName',
  definitionUri: 'fakeLabwareDefinitionUri',
  displayName: 'a fake labware',
  location: {
    slotName: '1',
  },
}
export const MODULE_ENTITY: LoadedModule = {
  id: 'module-0',
  model: 'thermocyclerModuleV1',
  location: { slotName: '4' },
  serialNumber: 'xyz',
}

export const PIPETTE_ENTITY: LoadedPipette = {
  id: 'pipette-0',
  pipetteName: 'p10_single',
  mount: 'left',
}

export const STORED_PROTOCOL_ANALYSIS = {
  ...storedProtocolData.mostRecentAnalysis,
  modules: [MODULE_ENTITY],
  labware: [LABWARE_ENTITY],
  pipettes: [PIPETTE_ENTITY],
} as ProtocolAnalysisOutput
