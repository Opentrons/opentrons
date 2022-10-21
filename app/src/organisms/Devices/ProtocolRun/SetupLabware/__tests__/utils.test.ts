import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/6/transferSettings.json'
import { getAllLabwareAndTiprackIdsInOrder } from '../utils'
import type {
  ProtocolAnalysisFile,
  LoadedLabware,
} from '@opentrons/shared-data'

const labware = [
  {
    id: 'fixedTrash',
    loadName: 'opentrons_1_trash_1100ml_fixed',
    displayName: 'Trash',
    definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
  },
  {
    id:
      '3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1',
    displayName: 'Opentrons 96 Tip Rack 1000 µL',
    loadName: 'opentrons_96_tiprack_1000ul',
    definitionUri: 'opentrons/opentrons_96_tiprack_1000ul/1',
  },
  {
    id:
      '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1',
    displayName: 'NEST 1 Well Reservoir 195 mL',
    definitionUri: 'opentrons/nest_1_reservoir_195ml/1',
    loadName: 'nest_1_reservoir_195ml',
  },
  {
    id:
      '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
    displayName: 'Corning 24 Well Plate 3.4 mL Flat',
    definitionUri: 'opentrons/corning_24_wellplate_3.4ml_flat/1',
    loadName: 'corning_24_wellplate_3.4ml_flat',
  },
  {
    id:
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
    displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
    definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
    loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
  },
  {
    id:
      'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
    displayName:
      'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL',
    definitionUri:
      'opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
    loadName: 'opentrons_96_aluminumblock_generic_pcr_strip_200ul',
  },
  {
    id:
      'b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
    displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt (1)',
    definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
    loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
  },
  {
    id:
      'faa13a50-a9bf-11eb-bce6-9f1d5b9c1a1b:opentrons/opentrons_96_tiprack_20ul/1',
    displayName: 'Opentrons 96 Tip Rack 20 µL',
    definitionUri: 'opentrons/opentrons_96_tiprack_20ul/1',
    loadName: 'opentrons_96_tiprack_20ul',
  },
  {
    id: '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b',
    displayName: 'Corning 24 Well Plate 3.4 mL Flat (1)',
    definitionUri: 'opentrons/corning_24_wellplate_3.4ml_flat/1',
    loadName: 'corning_24_wellplate_3.4ml_flat',
  },
] as LoadedLabware[]

const protocolWithMagTempTC = (_protocolWithMagTempTC as unknown) as ProtocolAnalysisFile

describe('getAllLabwareAndTiprackIdsInOrder', () => {
  it('should get all the labware and tiprack ids in order', () => {
    const result = [
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      '3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1',
      'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
      '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1',
      '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b',
      'b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      'faa13a50-a9bf-11eb-bce6-9f1d5b9c1a1b:opentrons/opentrons_96_tiprack_20ul/1',
    ]
    expect(
      getAllLabwareAndTiprackIdsInOrder(
        labware,
        protocolWithMagTempTC.labwareDefinitions,
        protocolWithMagTempTC.commands
      )
    ).toEqual(result)
  })
})
