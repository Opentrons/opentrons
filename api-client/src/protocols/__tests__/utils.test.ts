import { RunTimeCommand } from '@opentrons/shared-data'
import {
  parseInitialPipetteNamesById,
  parseInitialPipetteNamesByMount,
  parseAllRequiredModuleModels,
  parseAllRequiredModuleModelsById,
  parseInitialLoadedLabwareById,
  parseInitialLoadedLabwareBySlot,
  parseInitialLoadedLabwareByModuleId,
  parseInitialLoadedLabwareDefinitionsById,
  parseInitialLoadedModulesBySlot,
} from '../utils'

import { simpleAnalysisFileFixture } from '../__fixtures__'

const mockRunTimeCommands: RunTimeCommand[] = simpleAnalysisFileFixture.commands as any

describe('parseInitialPipetteNamesByMount', () => {
  it('returns pipette names for each mount if loaded and null if nothing loaded', () => {
    const expected = {
      left: 'p300_single_gen2',
      right: null,
    }
    expect(parseInitialPipetteNamesByMount(mockRunTimeCommands)).toEqual(
      expected
    )
  })
  it('returns pipette names for right mount if loaded', () => {
    const onlyRightMount: RunTimeCommand[] = mockRunTimeCommands.map(c =>
      c.commandType === 'loadPipette'
        ? { ...c, params: { ...c.params, mount: 'right' } }
        : c
    )
    const expected = {
      left: null,
      right: 'p300_single_gen2',
    }
    expect(parseInitialPipetteNamesByMount(onlyRightMount)).toEqual(expected)
  })
})
describe('parseInitialPipetteNamesById', () => {
  it('returns pipette names by id if loaded', () => {
    const expected = {
      'pipette-0': { name: 'p300_single_gen2' },
    }
    expect(parseInitialPipetteNamesById(mockRunTimeCommands)).toEqual(expected)
  })
})
describe('parseAllRequiredModuleModels', () => {
  it('returns all models for all loaded modules', () => {
    const expected = ['magneticModuleV2', 'temperatureModuleV2']
    expect(parseAllRequiredModuleModels(mockRunTimeCommands)).toEqual(expected)
  })
})
describe('parseAllRequiredModuleModelsById', () => {
  it('returns models by id for all loaded modules', () => {
    const expected = {
      'module-0': { model: 'magneticModuleV2' },
      'module-1': { model: 'temperatureModuleV2' },
    }
    expect(parseAllRequiredModuleModelsById(mockRunTimeCommands)).toEqual(
      expected
    )
  })
})
describe('parseInitialLoadedLabwareBySlot', () => {
  it('returns only labware loaded in slots', () => {
    const expected = {
      2: mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' &&
          'slotName' in c.params?.location &&
          c.params?.location?.slotName === '2'
      ),
      12: mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' &&
          'slotName' in c.params?.location &&
          c.params?.location?.slotName === '12'
      ),
    }
    expect(parseInitialLoadedLabwareBySlot(mockRunTimeCommands)).toEqual(
      expected
    )
  })
})
describe('parseInitialLoadedLabwareByModuleId', () => {
  it('returns only labware loaded in modules', () => {
    const expected = {
      'module-0': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' &&
          'moduleId' in c.params?.location &&
          c.params?.location?.moduleId === 'module-0'
      ),
      'module-1': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' &&
          'moduleId' in c.params?.location &&
          c.params?.location?.moduleId === 'module-1'
      ),
    }
    expect(parseInitialLoadedLabwareByModuleId(mockRunTimeCommands)).toEqual(
      expected
    )
  })
})
describe('parseInitialLoadedLabwareById', () => {
  it('returns labware loaded by id', () => {
    const expected = {
      'labware-1': {
        definitionId: 'opentrons/opentrons_96_tiprack_300ul/1_id',
        displayName: 'Opentrons 96 Tip Rack 300 µL',
      },
      'labware-2': {
        definitionId: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1_id',
        displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
      },
      'labware-3': {
        definitionId:
          'opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/1_id',
        displayName:
          'Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap',
      },
    }
    expect(parseInitialLoadedLabwareById(mockRunTimeCommands)).toEqual(expected)
  })
})
describe('parseInitialLoadedLabwareDefinitionsById', () => {
  it('returns labware definitions loaded by id', () => {
    const expected = {
      'opentrons/opentrons_96_tiprack_300ul/1_id': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' && c.result.labwareId === 'labware-1'
      )?.result.definition,
      'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1_id': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' && c.result.labwareId === 'labware-2'
      )?.result.definition,
      'opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/1_id': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' && c.result.labwareId === 'labware-3'
      )?.result.definition,
    }
    expect(
      parseInitialLoadedLabwareDefinitionsById(mockRunTimeCommands)
    ).toEqual(expected)
  })
})
describe('parseInitialLoadedModulesBySlot', () => {
  it('returns modules loaded in slots', () => {
    const expected = {
      1: mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadModule' &&
          'slotName' in c.params?.location &&
          c.params?.location?.slotName === '1'
      ),
      3: mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadModule' &&
          'slotName' in c.params?.location &&
          c.params?.location?.slotName === '3'
      ),
    }
    expect(parseInitialLoadedModulesBySlot(mockRunTimeCommands)).toEqual(
      expected
    )
  })
})
