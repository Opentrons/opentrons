import { getPrimaryPipetteId } from '../utils/getPrimaryPipetteId'
import type { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV4'

describe('getPrimaryPipetteId', () => {
  it('should return the one and only pipette if there is only one pipette in the protocol', () => {
    const mockPipette: Record<string, FilePipette> = {
      p10SingleId: {
        mount: 'left',
        name: 'p10_single',
      },
    }
    expect(getPrimaryPipetteId({ ...mockPipette })).toBe('p10SingleId')
  })
  it('should throw an error if there are two pipettes with the same mount', () => {
    const p10Single: Record<string, FilePipette> = {
      p10SingleId: {
        mount: 'left',
        name: 'p10_single',
      },
    }
    const p10Multi: Record<string, FilePipette> = {
      p10MultiId: {
        mount: 'left',
        name: 'p10_multi',
      },
    }

    const pipettes = {
      ...p10Single,
      ...p10Multi,
    }
    expect(() => getPrimaryPipetteId(pipettes)).toThrow()
  })
  it('should return the pipette with fewer channels', () => {
    const p10Single: Record<string, FilePipette> = {
      p10SingleId: {
        mount: 'left',
        name: 'p10_single',
      },
    }
    const p10Multi: Record<string, FilePipette> = {
      p10MultiId: {
        mount: 'right',
        name: 'p10_multi',
      },
    }

    const pipettes = {
      ...p10Single,
      ...p10Multi,
    }
    expect(getPrimaryPipetteId(pipettes)).toBe('p10SingleId')
  })
  it('should return the smaller pipette', () => {
    const p10Single: Record<string, FilePipette> = {
      p10SingleId: {
        mount: 'right',
        name: 'p10_single',
      },
    }
    const p50Multi: Record<string, FilePipette> = {
      p50MultiId: {
        mount: 'left',
        name: 'p50_single',
      },
    }

    const pipettes = {
      ...p10Single,
      ...p50Multi,
    }
    expect(getPrimaryPipetteId(pipettes)).toBe('p10SingleId')
  })
  it('should return the newer model', () => {
    const p300Single: Record<string, FilePipette> = {
      p300SingleId: {
        mount: 'right',
        name: 'p300_single',
      },
    }
    const p300SingleGen2: Record<string, FilePipette> = {
      p300SingleGen2Id: {
        mount: 'left',
        name: 'p300_single_gen2',
      },
    }

    const pipettes = {
      ...p300Single,
      ...p300SingleGen2,
    }
    expect(getPrimaryPipetteId(pipettes)).toBe('p300SingleGen2Id')
  })

  it('should return the left pipette when all else is the same', () => {
    const p300SingleLeft: Record<string, FilePipette> = {
      p300SingleLeftId: {
        mount: 'left',
        name: 'p300_single',
      },
    }
    const p300SingleRight: Record<string, FilePipette> = {
      p300SingleRightId: {
        mount: 'right',
        name: 'p300_single',
      },
    }

    const pipettes = {
      ...p300SingleLeft,
      ...p300SingleRight,
    }
    expect(getPrimaryPipetteId(pipettes)).toBe('p300SingleLeftId')
  })
})
