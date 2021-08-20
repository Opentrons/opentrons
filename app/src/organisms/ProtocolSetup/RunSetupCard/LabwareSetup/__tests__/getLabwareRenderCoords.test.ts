import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/4/transferSettings.json'
import _standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { getLabwareRenderCoords } from '../../../utils/getLabwareRenderCoords'
import { JsonProtocolFile } from '@opentrons/shared-data'

const protocolWithMagTempTC = _protocolWithMagTempTC as JsonProtocolFile
const standardDeckDef = _standardDeckDef as any

describe('getLabwareRenderCoords', () => {
  it('should gather labware coordinates with module offsets', () => {
    // these are just taken from the ot-2 deck def for readability
    const SLOT_1_COORDS = [0, 0, 0]
    const SLOT_2_COORDS = [132.5, 0.0, 0.0]
    const SLOT_3_COORDS = [265.0, 0.0, 0.0]
    const SLOT_4_COORDS = [0.0, 90.5, 0.0]
    const SLOT_5_COORDS = [132.5, 90.5, 0.0]
    const SLOT_6_COORDS = [265.0, 90.5, 0.0]
    const SLOT_7_COORDS = [0.0, 181.0, 0.0]
    const SLOT_9_COORDS = [265.0, 181.0, 0.0]

    // labware offsets come from module defs, they are just here for readability
    const MAG_MOD_LABWARE_OFFSET = [-1.175, -0.125, 82.25]
    const TEMP_MOD_LABWARE_OFFSET = [-1.45, -0.15, 80.09]
    const TC_LABWARE_OFFSET = [0, 82.56, 97.8]

    // module ids come from the fixture protocol, they are just here for readability
    const OPENTRONS_96_TIPRACK_1000UL_TIPRACK_ID =
      '3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1'
    const NEST_1_RESEVOIR_195ML_ID =
      '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1'
    const CORNING_24_WELLPLATE_1_ID = '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b'
    const CORNING_24_WELLPLATE_2_ID =
      '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1'
    const NEST_96_WELLPLATE_100UL_1_ID =
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
    const OPENTRONS_96_ALUMINUM_BLOCK_ID =
      'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1'
    const NEST_96_WELLPLATE_100UL_2_ID =
      'b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
    const OPENTRONS_96_TIPRACK_20UL_TIPRACK_ID =
      'faa13a50-a9bf-11eb-bce6-9f1d5b9c1a1b:opentrons/opentrons_96_tiprack_20ul/1'
    const expected = {
      // slot 1 has mag mod
      [NEST_96_WELLPLATE_100UL_1_ID]: {
        labwareDef: expect.anything(),
        x: SLOT_1_COORDS[0] + MAG_MOD_LABWARE_OFFSET[0],
        y: SLOT_1_COORDS[1] + MAG_MOD_LABWARE_OFFSET[1],
        z: SLOT_1_COORDS[2] + MAG_MOD_LABWARE_OFFSET[2],
      },
      // slot 2
      [OPENTRONS_96_TIPRACK_1000UL_TIPRACK_ID]: {
        labwareDef: expect.anything(),
        x: SLOT_2_COORDS[0],
        y: SLOT_2_COORDS[1],
        z: SLOT_2_COORDS[2],
      },
      // slot 3 has temp mod
      [OPENTRONS_96_ALUMINUM_BLOCK_ID]: {
        labwareDef: expect.anything(),
        x: SLOT_3_COORDS[0] + TEMP_MOD_LABWARE_OFFSET[0],
        y: SLOT_3_COORDS[1] + TEMP_MOD_LABWARE_OFFSET[1],
        z: SLOT_3_COORDS[2] + TEMP_MOD_LABWARE_OFFSET[2],
      },
      // slot 4
      [NEST_1_RESEVOIR_195ML_ID]: {
        labwareDef: expect.anything(),
        x: SLOT_4_COORDS[0],
        y: SLOT_4_COORDS[1],
        z: SLOT_4_COORDS[2],
      },
      // slot 5
      [CORNING_24_WELLPLATE_2_ID]: {
        labwareDef: expect.anything(),
        x: SLOT_5_COORDS[0],
        y: SLOT_5_COORDS[1],
        z: SLOT_5_COORDS[2],
      },
      // slot 6
      [CORNING_24_WELLPLATE_1_ID]: {
        labwareDef: expect.anything(),
        x: SLOT_6_COORDS[0],
        y: SLOT_6_COORDS[1],
        z: SLOT_6_COORDS[2],
      },
      // slot 7 has TC
      [NEST_96_WELLPLATE_100UL_2_ID]: {
        labwareDef: expect.anything(),
        x: SLOT_7_COORDS[0] + TC_LABWARE_OFFSET[0],
        y: SLOT_7_COORDS[1] + TC_LABWARE_OFFSET[1],
        z: SLOT_7_COORDS[2] + TC_LABWARE_OFFSET[2],
      },
      // slot 9
      [OPENTRONS_96_TIPRACK_20UL_TIPRACK_ID]: {
        labwareDef: expect.anything(),
        x: SLOT_9_COORDS[0],
        y: SLOT_9_COORDS[1],
        z: SLOT_9_COORDS[2],
      },
    }

    expect(
      getLabwareRenderCoords(protocolWithMagTempTC, standardDeckDef)
    ).toEqual(expected)
  })
})
