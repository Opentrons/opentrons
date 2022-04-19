import { RunTimeCommand } from '@opentrons/shared-data'
import {
  parseInitialPipetteNamesByMount,
  parseAllRequiredModuleModels,
  parseInitialLoadedLabwareBySlot,
  parseInitialLoadedLabwareByModuleId,
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
describe('parseAllRequiredModuleModels', () => {
  it('returns all models for all loaded modules', () => {
    const expected = ['magneticModuleV2', 'temperatureModuleV2']
    expect(parseAllRequiredModuleModels(mockRunTimeCommands)).toEqual(expected)
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
