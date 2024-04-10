import { describe, it, expect } from 'vitest'
import { getIdsInRange, getUnoccupiedSlotForMoveableTrash } from '../utils'
import type { AddressableAreaName, CreateCommand } from '@opentrons/shared-data'

describe('getIdsInRange', () => {
  it('gets id in array of length 1', () => {
    expect(getIdsInRange(['X'], 'X', 'X')).toEqual(['X'])
  })
  it('gets ids in array of length > 1', () => {
    const orderedIds = ['T', 'E', 'S', 'TTT', 'C', 'A', 'SSS', 'EEE']
    // includes first element
    expect(getIdsInRange(orderedIds, 'T', 'C')).toEqual([
      'T',
      'E',
      'S',
      'TTT',
      'C',
    ])
    // middle
    expect(getIdsInRange(orderedIds, 'S', 'A')).toEqual(['S', 'TTT', 'C', 'A'])
    // includes last element
    expect(getIdsInRange(orderedIds, 'S', 'EEE')).toEqual([
      'S',
      'TTT',
      'C',
      'A',
      'SSS',
      'EEE',
    ])
    // startId same as endId
    expect(getIdsInRange(orderedIds, 'T', 'T')).toEqual(['T'])
  })
})
describe('getUnoccupiedSlotForMoveableTrash', () => {
  it('returns slot C1 when all other slots are occupied by modules, labware, moveLabware, and staging areas', () => {
    const mockPDFile: any = {
      commands: [
        {
          key: '7353ae60-c85e-45c4-8d69-59ff3a97debd',
          commandType: 'loadModule',
          params: {
            model: 'thermocyclerModuleV2',
            location: { slotName: 'B1' },
            moduleId:
              '771f390f-01a9-4615-9c4e-4dbfc95844b5:thermocyclerModuleType',
          },
        },
        {
          key: '82e5d08f-ceae-4eb8-8600-b61a973d47d9',
          commandType: 'loadModule',
          params: {
            model: 'heaterShakerModuleV1',
            location: { slotName: 'D1' },
            moduleId:
              'b9df03af-3844-4ae8-a1cf-cae61a6b4992:heaterShakerModuleType',
          },
        },
        {
          key: '49bc2a29-a7d2-42a6-8610-e07a9ad166df',
          commandType: 'loadModule',
          params: {
            model: 'temperatureModuleV2',
            location: { slotName: 'D3' },
            moduleId:
              '52bea856-eea6-473c-80df-b316f3559692:temperatureModuleType',
          },
        },
        {
          key: '864fadd7-f2c1-400a-b2ef-24d0c887a3c8',
          commandType: 'loadLabware',
          params: {
            displayName: 'Opentrons Flex 96 Tip Rack 50 µL',
            labwareId:
              '88881828-037c-4445-ba57-121164f4a53a:opentrons/opentrons_flex_96_tiprack_50ul/1',
            loadName: 'opentrons_flex_96_tiprack_50ul',
            namespace: 'opentrons',
            version: 1,
            location: { slotName: 'C2' },
          },
        },
        {
          key: '79994418-d664-4884-9441-4b0fa62bd143',
          commandType: 'loadLabware',
          params: {
            displayName: 'Bio-Rad 96 Well Plate 200 µL PCR',
            labwareId:
              '733c04a8-ae8c-449f-a1f9-ca3783fdda58:opentrons/biorad_96_wellplate_200ul_pcr/2',
            loadName: 'biorad_96_wellplate_200ul_pcr',
            namespace: 'opentrons',
            version: 2,
            location: { addressableAreaName: 'A4' },
          },
        },
        {
          key: 'b2170a2c-d202-4129-9cd7-ffa4e35d57bb',
          commandType: 'loadLabware',
          params: {
            displayName: 'Corning 24 Well Plate 3.4 mL Flat',
            labwareId:
              '32e97c67-866e-4153-bcb7-2b86b1d3f1fe:opentrons/corning_24_wellplate_3.4ml_flat/2',
            loadName: 'corning_24_wellplate_3.4ml_flat',
            namespace: 'opentrons',
            version: 2,
            location: { slotName: 'B3' },
          },
        },
        {
          key: 'fb1807fe-ca16-4f75-b44d-803d704c7d98',
          commandType: 'loadLabware',
          params: {
            displayName: 'Opentrons Flex 96 Tip Rack 50 µL',
            labwareId:
              '11fdsa8b1-bf4b-4a6c-80cb-b8e5bdfe309b:opentrons/opentrons_flex_96_tiprack_50ul/1',
            loadName: 'opentrons_flex_96_tiprack_50ul',
            namespace: 'opentrons',
            version: 1,
            location: {
              labwareId:
                '32e97c67-866e-4153-bcb7-2b86b1d3f1fe:opentrons/corning_24_wellplate_3.4ml_flat/2',
            },
          },
        },
        {
          commandType: 'moveLabware',
          key: '1395243a-958f-4305-9687-52cdaf39f2b6',
          params: {
            labwareId:
              '733c04a8-ae8c-449f-a1f9-ca3783fdda58:opentrons/biorad_96_wellplate_200ul_pcr/2',
            strategy: 'usingGripper',
            newLocation: { slotName: 'C1' },
          },
        },
        {
          commandType: 'moveLabware',
          key: '4e39e7ec-4ada-4e3c-8369-1ff7421061a9',
          params: {
            labwareId:
              '32e97c67-866e-4153-bcb7-2b86b1d3f1fe:opentrons/corning_24_wellplate_3.4ml_flat/2',
            strategy: 'usingGripper',
            newLocation: { addressableAreaName: 'A4' },
          },
        },
      ] as CreateCommand[],
    }
    const mockStagingAreaSlotNames: AddressableAreaName[] = ['A4', 'B4']
    const mockHasWasteChuteCommands = false

    expect(
      getUnoccupiedSlotForMoveableTrash(
        mockPDFile,
        mockHasWasteChuteCommands,
        mockStagingAreaSlotNames
      )
    ).toStrictEqual('C3')
  })
})
