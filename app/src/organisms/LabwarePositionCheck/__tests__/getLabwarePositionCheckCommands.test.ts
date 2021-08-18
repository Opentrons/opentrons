import { getLabwarePositionCheckCommands } from '../utils/getLabwarePositionCheckCommands'
import { getPrimaryPipetteId } from '../utils/getPrimaryPipetteId'
import { getPipetteWorkflow } from '../utils/getPipetteWorkflow'
import { getOnePipetteWorkflowCommands } from '../utils/getOnePipetteWorkflowCommands'
import { getTwoPipetteWorkflowCommands } from '../utils/getTwoPipetteWorkflowCommands'
import { when, resetAllWhenMocks } from 'jest-when'
import { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV4'
import _uncasted_protocolWithOnePipette from '@opentrons/shared-data/protocol/fixtures/4/simpleV4.json'
import _uncasted_protocolWithTwoPipettes from '@opentrons/shared-data/protocol/fixtures/4/transferSettings.json'

import { ProtocolFileV5 } from '@opentrons/shared-data'

const protocolWithOnePipette = _uncasted_protocolWithOnePipette as ProtocolFileV5<any>
const protocolWithTwoPipettes = _uncasted_protocolWithTwoPipettes as ProtocolFileV5<any>

jest.mock('../utils/getPrimaryPipetteId')
jest.mock('../utils/getPipetteWorkflow')
jest.mock('../utils/getOnePipetteWorkflowCommands')
jest.mock('../utils/getTwoPipetteWorkflowCommands')

const mockGetPrimaryPipetteId = getPrimaryPipetteId as jest.MockedFunction<
  typeof getPrimaryPipetteId
>
const mockGetPipetteWorkflow = getPipetteWorkflow as jest.MockedFunction<
  typeof getPipetteWorkflow
>
const mockGetOnePipetteWorkflowCommands = getOnePipetteWorkflowCommands as jest.MockedFunction<
  typeof getOnePipetteWorkflowCommands
>
const mockGetTwoPipetteWorkflowCommands = getTwoPipetteWorkflowCommands as jest.MockedFunction<
  typeof getTwoPipetteWorkflowCommands
>

describe('getLabwarePositionCheckCommands', () => {
  beforeEach(() => {})
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should generate commands with the one pipette workflow', () => {
    const mockPipette: FilePipette = protocolWithOnePipette.pipettes.pipetteId
    when(mockGetPrimaryPipetteId)
      .calledWith([mockPipette])
      .mockReturnValue(mockPipette.name)

    when(mockGetPipetteWorkflow)
      .calledWith({
        pipettes: [mockPipette],
        primaryPipette: mockPipette.name,
        labware: protocolWithOnePipette.labware,
        commands: protocolWithOnePipette.commands,
      })
      .mockReturnValue(1)

    getLabwarePositionCheckCommands(protocolWithOnePipette)

    expect(mockGetOnePipetteWorkflowCommands).toHaveBeenCalledWith({
      primaryPipette: mockPipette.name,
      labware: protocolWithOnePipette.labware,
      commands: protocolWithOnePipette.commands,
    })
  })
  it('should generate commands with the two pipette workflow', () => {
    const leftPipette: FilePipette =
      protocolWithTwoPipettes.pipettes['3dff4f90-3412-11eb-ad93-ed232a2337cf']
    const rightPipette: FilePipette =
      protocolWithTwoPipettes.pipettes['4da579b0-a9bf-11eb-bce6-9f1d5b9c1a1b']

    when(mockGetPrimaryPipetteId)
      .calledWith([leftPipette, rightPipette])
      .mockReturnValue(leftPipette.name)

    when(mockGetPipetteWorkflow)
      .calledWith({
        pipettes: [leftPipette, rightPipette],
        primaryPipette: leftPipette.name,
        labware: protocolWithTwoPipettes.labware,
        commands: protocolWithTwoPipettes.commands,
      })
      .mockReturnValue(2)

    getLabwarePositionCheckCommands(protocolWithTwoPipettes)

    expect(mockGetTwoPipetteWorkflowCommands).toHaveBeenCalledWith({
      primaryPipette: leftPipette.name,
      secondaryPipette: rightPipette.name,
      labware: protocolWithTwoPipettes.labware,
      commands: protocolWithTwoPipettes.commands,
    })
  })
})
