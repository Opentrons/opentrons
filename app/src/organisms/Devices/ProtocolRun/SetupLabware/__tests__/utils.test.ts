import { getLatestCurrentOffsets } from '../utils'
import type { LabwareOffset } from '@opentrons/api-client'

describe('getLabwareSetupItemGroups', () => {
  it.todo('should thoroughly test this fn')
})

describe('getLatestCurrentOffsets', () => {
  it('should return the latest offsets when there are multiple offsets', () => {
    const mockCurrentOffsets: LabwareOffset[] = [
      {
        createdAt: '2022-12-20T14:06:23.562082+00:00',
        definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
        id: 'dceac542-bca4-4313-82ba-d54a19dab204',
        location: { slotName: '2' },
        vector: { x: 0, y: -0.09999999999999432, z: 0 },
      },
      {
        createdAt: '2022-12-20T14:06:23.562878+00:00',
        definitionUri:
          'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
        id: '70ae2e31-716b-4e1f-a90c-9b0dfd4d7feb',
        location: { slotName: '1', moduleModel: 'heaterShakerModuleV1' },
        vector: { x: 0, y: 0, z: 0 },
      },
      {
        createdAt: '2022-12-20T14:09:08.688756+00:00',
        definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
        id: '494ec3d1-224f-4f9a-a83b-3dd3060ea332',
        location: { slotName: '2' },
        vector: { x: 0, y: -0.09999999999999432, z: -0.09999999999999432 },
      },
      {
        createdAt: '2022-12-20T14:09:08.689813+00:00',
        definitionUri:
          'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
        id: 'd39b972e-9b2d-436c-a597-3bc81aabc634',
        location: { slotName: '1', moduleModel: 'heaterShakerModuleV1' },
        vector: { x: -0.10000000000000142, y: 0, z: 0 },
      },
    ]
    const mockLatestCurrentOffsets = [
      {
        createdAt: '2022-12-20T14:09:08.689813+00:00',
        definitionUri:
          'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
        id: 'd39b972e-9b2d-436c-a597-3bc81aabc634',
        location: { slotName: '1', moduleModel: 'heaterShakerModuleV1' },
        vector: { x: -0.10000000000000142, y: 0, z: 0 },
      },
      {
        createdAt: '2022-12-20T14:09:08.688756+00:00',
        definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
        id: '494ec3d1-224f-4f9a-a83b-3dd3060ea332',
        location: { slotName: '2' },
        vector: { x: 0, y: -0.09999999999999432, z: -0.09999999999999432 },
      },
    ]

    expect(getLatestCurrentOffsets(mockCurrentOffsets)).toStrictEqual(
      mockLatestCurrentOffsets
    )
  })
  it('should return empty array when the labware vector values are 0', () => {
    const mockCurrentOffsets: LabwareOffset[] = [
      {
        createdAt: '2022-12-20T14:06:23.562878+00:00',
        definitionUri:
          'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
        id: '70ae2e31-716b-4e1f-a90c-9b0dfd4d7feb',
        location: { slotName: '1', moduleModel: 'heaterShakerModuleV1' },
        vector: { x: 0, y: 0, z: 0 },
      },
    ]

    expect(getLatestCurrentOffsets(mockCurrentOffsets)).toStrictEqual([])
  })
})
