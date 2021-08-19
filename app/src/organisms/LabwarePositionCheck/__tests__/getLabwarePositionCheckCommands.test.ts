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
      .calledWith(protocolWithOnePipette.pipettes)
      .mockReturnValue('pipetteId')

    when(mockGetPipetteWorkflow)
      .calledWith({
        pipetteNames: [mockPipette.name],
        primaryPipetteId: 'pipetteId',
        labware: protocolWithOnePipette.labware,
        labwareDefinitions: protocolWithOnePipette.labwareDefinitions,
        commands: protocolWithOnePipette.commands,
      })
      .mockReturnValue(1)

    getLabwarePositionCheckCommands(protocolWithOnePipette)

    expect(mockGetOnePipetteWorkflowCommands).toHaveBeenCalledWith({
      primaryPipetteId: 'pipetteId',
      labware: protocolWithOnePipette.labware,
      labwareDefinitions: protocolWithOnePipette.labwareDefinitions,
      modules: protocolWithOnePipette.modules,
    })
  })
  it('should generate commands with the two pipette workflow', () => {
    const leftPipetteId = '3dff4f90-3412-11eb-ad93-ed232a2337cf'
    const rightPipetteId = '4da579b0-a9bf-11eb-bce6-9f1d5b9c1a1b'
    const leftPipette: FilePipette =
      protocolWithTwoPipettes.pipettes[leftPipetteId]
    const rightPipette: FilePipette =
      protocolWithTwoPipettes.pipettes[rightPipetteId]

    when(mockGetPrimaryPipetteId)
      .calledWith(protocolWithTwoPipettes.pipettes)
      .mockReturnValue(leftPipetteId)

    when(mockGetPipetteWorkflow)
      .calledWith({
        pipetteNames: [leftPipette.name, rightPipette.name],
        primaryPipetteId: leftPipetteId,
        labware: protocolWithTwoPipettes.labware,
        labwareDefinitions: protocolWithTwoPipettes.labwareDefinitions,
        commands: protocolWithTwoPipettes.commands,
      })
      .mockReturnValue(2)

    getLabwarePositionCheckCommands(protocolWithTwoPipettes)

    expect(mockGetTwoPipetteWorkflowCommands).toHaveBeenCalledWith({
      primaryPipetteId: leftPipetteId,
      secondaryPipetteId: rightPipetteId,
      labware: protocolWithTwoPipettes.labware,
      labwareDefinitions: protocolWithTwoPipettes.labwareDefinitions,
      modules: protocolWithTwoPipettes.modules,
    })
  })
})
