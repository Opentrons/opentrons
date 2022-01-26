import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/6/transferSettings.json'
import { createSnippet } from '../createSnippet'
import { ProtocolFile } from '@opentrons/shared-data'

const protocolWithMagTempTC = (_protocolWithMagTempTC as unknown) as ProtocolFile<{}>

describe('createSnippet', () => {
  it('should generate expected python snippet for jupyter', () => {
    // module ids come from the fixture protocol, they are just here for readability
    const TIPRACK_DEF_URI = 'opentrons/opentrons_96_tiprack_1000ul/1'
    const TC_PLATE_DEF_URI =
      'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
    const SLOT_PLATE_DEF_URI = 'opentrons/corning_24_wellplate_3.4ml_flat/1'

    const TC_MODULE_ID =
      '3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType'

    const labwareOffsets = [
      {
        id: 'offset_for_tiprack',
        createdAt: 'fake_timestamp',
        definitionUri: TIPRACK_DEF_URI,
        location: { slotName: '2' },
        vector: { x: 1, y: 0, z: 0 },
      },
      {
        id: 'offset_for_lw_on_module',
        createdAt: 'fake_timestamp',
        definitionUri: TC_PLATE_DEF_URI,
        location: {
          slotName: '7',
          moduleModel: 'thermocyclerModuleV1',
        },
        vector: { x: 0, y: 2, z: 0 },
      },
      {
        id: 'offset_for_lw_on_deck',
        createdAt: 'fake_timestamp',
        definitionUri: SLOT_PLATE_DEF_URI,
        location: { slotName: '6' },
        vector: { x: 0, y: 0, z: 3 },
      },
    ]

    const juptyerPrefix =
      'import opentrons.execute\nprotocol = opentrons.execute.get_protocol_api("2.12")\n\n'
    const resultingSnippet = createSnippet(
      'jupyter',
      protocolWithMagTempTC,
      labwareOffsets
    )
    console.log(resultingSnippet)
    expect(resultingSnippet).toContain(juptyerPrefix)
  })
})
