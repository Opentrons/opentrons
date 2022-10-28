import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/6/transferSettings.json'
import { getAllLabwareAndTiprackIdsInOrder } from '../utils'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

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
        protocolWithMagTempTC.labware,
        protocolWithMagTempTC.labwareDefinitions,
        protocolWithMagTempTC.commands
      )
    ).toEqual(result)
  })
})
