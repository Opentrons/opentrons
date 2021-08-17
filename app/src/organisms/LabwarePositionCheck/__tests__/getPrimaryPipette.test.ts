import { getPrimaryPipette } from '../utils/getPrimaryPipette'
import type { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV4'

describe('getPrimaryPipette', () => {
  it('should return the one and only pipette if there is only one pipette in the protocol', () => {
    const mockPipette: FilePipette = {
      mount: 'left',
      name: 'p10_single',
    }
    expect(getPrimaryPipette([mockPipette])).toBe(mockPipette.name)
  })
  it('should throw an error if there are two pipettes with the same mount', () => {
    const p10Single: FilePipette = {
      mount: 'left',
      name: 'p10_single',
    }
    const p10Multi: FilePipette = {
      mount: 'left', // two left mounts
      name: 'p10_multi',
    }
    expect(() => getPrimaryPipette([p10Single, p10Multi])).toThrow()
  })
  it('should return the pipette with fewer channels', () => {
    const p10Single: FilePipette = {
      mount: 'left',
      name: 'p10_single',
    }
    const p10Multi: FilePipette = {
      mount: 'right',
      name: 'p10_multi',
    }
    expect(getPrimaryPipette([p10Single, p10Multi])).toBe(p10Single.name)
  })
})
