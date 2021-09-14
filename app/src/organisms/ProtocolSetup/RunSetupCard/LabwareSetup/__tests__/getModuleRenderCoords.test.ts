import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/4/transferSettings.json'
import _standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { getModuleRenderInfo } from '../../../utils/getModuleRenderInfo'
import { JsonProtocolFile } from '@opentrons/shared-data'

const protocolWithMagTempTC = _protocolWithMagTempTC as JsonProtocolFile
const standardDeckDef = _standardDeckDef as any

describe('getModuleRenderInfo', () => {
  it('should gather module coordinates', () => {
    // mag mod is in deck slot 1 which has [x,y] coordinate [0,0,0]
    const SLOT_1_COORDS = [0, 0, 0]
    // temp mod is in deck slot 3 which has [x,y] coordinate [265,0,0]
    const SLOT_3_COORDS = [265, 0, 0]
    // TC takes up rests in slot 7 which has [x,y] coordinate [0,181,0]
    const SLOT_7_COORDS = [0, 181, 0]
    // these ids come from the protocol fixture
    const MAG_MOD_ID = '3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType'
    const TEMP_MOD_ID =
      '3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType'
    const TC_ID = '3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType'

    const expectedCoords = {
      [MAG_MOD_ID]: {
        x: SLOT_1_COORDS[0],
        y: SLOT_1_COORDS[1],
        z: SLOT_1_COORDS[2],
        moduleModel: 'magneticModuleV2',
      },
      [TEMP_MOD_ID]: {
        x: SLOT_3_COORDS[0],
        y: SLOT_3_COORDS[1],
        z: SLOT_3_COORDS[2],
        moduleModel: 'temperatureModuleV2',
      },
      [TC_ID]: {
        x: SLOT_7_COORDS[0],
        y: SLOT_7_COORDS[1],
        z: SLOT_7_COORDS[2],
        moduleModel: 'thermocyclerModuleV1',
      },
    }

    expect(getModuleRenderInfo(protocolWithMagTempTC, standardDeckDef)).toEqual(
      expectedCoords
    )
  })
})
