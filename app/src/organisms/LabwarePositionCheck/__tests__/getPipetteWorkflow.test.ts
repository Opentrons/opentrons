import { PipetteName } from '@opentrons/shared-data'
import { getPipetteWorkflow } from '../utils/getPipetteWorkflow'
import { doesPipetteVisitAllTipracks } from '../utils/doesPipetteVisitAllTipracks'
import { when, resetAllWhenMocks } from 'jest-when'
import type {
  Command,
  MoveToWellParams,
} from '@opentrons/shared-data/protocol/types/schemaV5'

jest.mock('../utils/doesPipetteVisitAllTipracks')

const mockDoesPipetteVisitAllTipracks = doesPipetteVisitAllTipracks as jest.MockedFunction<
  typeof doesPipetteVisitAllTipracks
>

describe('getPipetteWorkflow', () => {
  beforeEach(() => {
    when(mockDoesPipetteVisitAllTipracks)
      .calledWith(expect.anything(), expect.anything(), expect.anything())
      .mockReturnValue(true)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should return 1 if there is only one pipette', () => {
    const pipetteNames: PipetteName[] = ['p1000_single']
    expect(
      getPipetteWorkflow({
        pipetteNames,
        primaryPipetteId: 'someId',
        labware: {},
        commands: [],
      })
    ).toBe(1)
  })
  it('should return 1 if the two pipettes are the same', () => {
    const pipetteNames: PipetteName[] = ['p1000_single', 'p1000_single']
    expect(
      getPipetteWorkflow({
        pipetteNames,
        primaryPipetteId: 'someId',
        labware: {},
        commands: [],
      })
    ).toBe(1)
  })
  it('should return 1 if the primary pipette visits all tipracks', () => {
    const pipetteNames: PipetteName[] = ['p1000_single', 'p1000_single_gen2']
    const primaryPipetteId = 'someId'
    const labware = {}
    const moveToWellCommand: Command = {
      command: 'moveToWell',
      params: {
        pipette: '',
        labware: '',
        well: '',
        offset: {
          x: 0,
          y: 0,
          z: 0,
        },
      },
    }
    const commands: Command[] = [moveToWellCommand]

    when(mockDoesPipetteVisitAllTipracks)
      .calledWith(primaryPipetteId, labware, commands)
      .mockReturnValue(false)

    expect(
      getPipetteWorkflow({
        pipetteNames,
        primaryPipetteId,
        labware,
        commands,
      })
    ).toBe(1)
  })
  it('should return 2 if the primary pipette does NOT visit all tipracks', () => {
    const pipetteNames: PipetteName[] = ['p1000_single', 'p1000_single_gen2']
    const primaryPipetteId = 'someId'
    const labware = {}
    const moveToWellCommand: Command = {
      command: 'moveToWell',
      params: {
        pipette: '',
        labware: '',
        well: '',
        offset: {
          x: 0,
          y: 0,
          z: 0,
        },
      },
    }
    const commands: Command[] = [moveToWellCommand]

    when(mockDoesPipetteVisitAllTipracks)
      .calledWith(primaryPipetteId, labware, commands)
      .mockReturnValue(false)

    expect(
      getPipetteWorkflow({
        pipetteNames,
        primaryPipetteId,
        labware,
        commands,
      })
    ).toBe(2)
  })
})
