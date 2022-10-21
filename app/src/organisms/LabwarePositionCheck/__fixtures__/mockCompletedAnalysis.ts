import { getLabwareDefURI } from "@opentrons/shared-data"
import { mockTipRackDef } from './mockTipRackDef'

import type { CompletedProtocolAnalysis } from "@opentrons/shared-data"

export const mockCompletedAnalysis: CompletedProtocolAnalysis = {
  id: 'fakeAnalysisId',
  status: 'completed',
  result: 'ok',
  errors: [],
  labware: [{
    id: 'labwareId1',
    loadName: 'fakeLoadName',
    definitionUri: getLabwareDefURI(mockTipRackDef),
    location: { slotName: '1' }
  }],
  pipettes: [{
    id: 'pipetteId1',
    pipetteName: 'p10_single',
    mount: 'left',
  }],
  modules: [],
  liquids: [],
  commands: [
    {
      commandType: 'loadLabware',
      id: 'fakeCommandId',
      status: 'succeeded',
      createdAt: 'fakeCreatedAtTimestamp',
      startedAt: 'fakeStartedAtTimestamp',
      completedAt: 'fakecompletedAtTimestamp',
      error: null,
      params: {
        labwareId: 'labwareId1',
        location: {slotName: '1'},
      },
      result: {
        labwareId: 'labwareId1',
        definition: mockTipRackDef,
        offset: {x: 0, y: 0, z: 0} 
      }
    }
  ]
}
