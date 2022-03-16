import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/6/transferSettings.json'
import { createSnippet } from '../createSnippet'
import { ModuleModel, ProtocolFile } from '@opentrons/shared-data'

const protocolWithMagTempTC = (_protocolWithMagTempTC as unknown) as ProtocolFile<{}>

// module ids come from the fixture protocol, they are just here for readability
const TIPRACK_DEF_URI = 'opentrons/opentrons_96_tiprack_1000ul/1'
const TC_PLATE_DEF_URI = 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
const SLOT_PLATE_DEF_URI = 'opentrons/corning_24_wellplate_3.4ml_flat/1'

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
      moduleModel: 'thermocyclerModuleV1' as ModuleModel,
    },
    vector: { x: 0, y: 2, z: 0 },
  },
  {
    id: 'offset_for_lw_on_deck',
    createdAt: 'fake_timestamp',
    definitionUri: SLOT_PLATE_DEF_URI,
    location: { slotName: '6' },
    vector: { x: 0, y: 0, z: 2.99999 },
  },
]

const juptyerPrefix =
  'import opentrons.execute\nprotocol = opentrons.execute.get_protocol_api("2.12")\n\n'
const cliPrefix =
  'from opentrons import protocol_api\n\nmetadata = {\n    "apiLevel": "2.12"\n}\n\ndef run(protocol: protocol_api.ProtocolContext):'

describe('createSnippet', () => {
  it('should generate expected python snippet for jupyter rounding vector values to 2 fixed decimal values', () => {
    const tipRackLoadAndOffset =
      'labware_2 = protocol.load_labware("opentrons_96_tiprack_1000ul", location="2")\nlabware_2.set_offset(x=1.00, y=0.00, z=0.00)'
    const tcPlateLoadAndOffset =
      'labware_7 = module_3.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")\nlabware_7.set_offset(x=0.00, y=2.00, z=0.00)'
    const wellPlateLoadAndOffset =
      'labware_9 = protocol.load_labware("corning_24_wellplate_3.4ml_flat", location="6")\nlabware_9.set_offset(x=0.00, y=0.00, z=3.00)'

    const resultingSnippet = createSnippet(
      'jupyter',
      protocolWithMagTempTC,
      labwareOffsets
    )

    expect(resultingSnippet).toContain(juptyerPrefix)
    expect(resultingSnippet).not.toContain(cliPrefix)

    expect(resultingSnippet).toContain(
      'module_1 = protocol.load_module("magneticModuleV2", location="1")'
    )
    expect(resultingSnippet).toContain(
      'module_2 = protocol.load_module("temperatureModuleV2", location="3")'
    )
    expect(resultingSnippet).toContain(
      'module_3 = protocol.load_module("thermocyclerModuleV1", location="7")'
    )

    expect(resultingSnippet).toContain(
      'labware_1 = protocol.load_labware("opentrons_1_trash_1100ml_fixed", location="12")'
    )
    expect(resultingSnippet).toContain(
      'labware_3 = protocol.load_labware("nest_1_reservoir_195ml", location="4")'
    )
    expect(resultingSnippet).toContain(
      'labware_4 = module_1.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")'
    )
    expect(resultingSnippet).toContain(
      'labware_5 = protocol.load_labware("corning_24_wellplate_3.4ml_flat", location="5")'
    )
    expect(resultingSnippet).toContain(
      'labware_6 = module_2.load_labware("opentrons_96_aluminumblock_generic_pcr_strip_200ul")'
    )
    expect(resultingSnippet).toContain(
      'labware_8 = protocol.load_labware("opentrons_96_tiprack_20ul", location="9")'
    )

    expect(resultingSnippet).toContain(tipRackLoadAndOffset)
    expect(resultingSnippet).toContain(tcPlateLoadAndOffset)
    expect(resultingSnippet).toContain(wellPlateLoadAndOffset)
  })
  it('should generate expected python snippet for cli rounding vector values to 2 fixed decimal values', () => {
    const tipRackLoadAndOffset =
      'labware_2 = protocol.load_labware("opentrons_96_tiprack_1000ul", location="2")\n    labware_2.set_offset(x=1.00, y=0.00, z=0.00)'
    const tcPlateLoadAndOffset =
      'labware_7 = module_3.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")\n    labware_7.set_offset(x=0.00, y=2.00, z=0.00)'
    const wellPlateLoadAndOffset =
      'labware_9 = protocol.load_labware("corning_24_wellplate_3.4ml_flat", location="6")\n    labware_9.set_offset(x=0.00, y=0.00, z=3.00)'
    const resultingSnippet = createSnippet(
      'cli',
      protocolWithMagTempTC,
      labwareOffsets
    )

    expect(resultingSnippet).toContain(
      'module_1 = protocol.load_module("magneticModuleV2", location="1")'
    )
    expect(resultingSnippet).toContain(
      'module_2 = protocol.load_module("temperatureModuleV2", location="3")'
    )
    expect(resultingSnippet).toContain(
      'module_3 = protocol.load_module("thermocyclerModuleV1", location="7")'
    )

    expect(resultingSnippet).toContain(
      'labware_1 = protocol.load_labware("opentrons_1_trash_1100ml_fixed", location="12")'
    )
    expect(resultingSnippet).toContain(
      'labware_3 = protocol.load_labware("nest_1_reservoir_195ml", location="4")'
    )
    expect(resultingSnippet).toContain(
      'labware_4 = module_1.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")'
    )
    expect(resultingSnippet).toContain(
      'labware_5 = protocol.load_labware("corning_24_wellplate_3.4ml_flat", location="5")'
    )
    expect(resultingSnippet).toContain(
      'labware_6 = module_2.load_labware("opentrons_96_aluminumblock_generic_pcr_strip_200ul")'
    )
    expect(resultingSnippet).toContain(
      'labware_8 = protocol.load_labware("opentrons_96_tiprack_20ul", location="9")'
    )
    expect(resultingSnippet).not.toContain(juptyerPrefix)
    expect(resultingSnippet).toContain(cliPrefix)
    expect(resultingSnippet).toContain(tipRackLoadAndOffset)
    expect(resultingSnippet).toContain(tcPlateLoadAndOffset)
    expect(resultingSnippet).toContain(wellPlateLoadAndOffset)
  })
})
