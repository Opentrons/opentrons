import { when, resetAllWhenMocks } from 'jest-when'
import _uncasted_protocolWithOnePipette from '@opentrons/shared-data/protocol/fixtures/4/simpleV4.json'
import _uncasted_protocolWithTwoPipettes from '@opentrons/shared-data/protocol/fixtures/4/transferSettings.json'
import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import { getPrimaryPipetteId } from '../utils/getPrimaryPipetteId'
import { getPipetteWorkflow } from '../utils/getPipetteWorkflow'
import { getOnePipettePositionCheckSteps } from '../utils/getOnePipettePositionCheckSteps'
import { getTwoPipettePositionCheckSteps } from '../utils/getTwoPipettePositionCheckSteps'

import type { FilePipette } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { ProtocolFile } from '@opentrons/shared-data'

// TODO: update these fixtures to be v6 protocols
const protocolWithOnePipette = _uncasted_protocolWithOnePipette as unknown as ProtocolFile<any>
const protocolWithTwoPipettes = _uncasted_protocolWithTwoPipettes as unknown as  ProtocolFile<any>

jest.mock('../utils/getPrimaryPipetteId')
jest.mock('../utils/getPipetteWorkflow')
jest.mock('../utils/getOnePipettePositionCheckSteps')
jest.mock('../utils/getTwoPipettePositionCheckSteps')

const mockGetPrimaryPipetteId = getPrimaryPipetteId as jest.MockedFunction<
  typeof getPrimaryPipetteId
>
const mockGetPipetteWorkflow = getPipetteWorkflow as jest.MockedFunction<
  typeof getPipetteWorkflow
>
const mockgetOnePipettePositionCheckSteps = getOnePipettePositionCheckSteps as jest.MockedFunction<
  typeof getOnePipettePositionCheckSteps
>
const mockgetTwoPipettePositionCheckSteps = getTwoPipettePositionCheckSteps as jest.MockedFunction<
  typeof getTwoPipettePositionCheckSteps
>

describe('getLabwarePositionCheckSteps', () => {
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

    getLabwarePositionCheckSteps(protocolWithOnePipette)

    expect(mockgetOnePipettePositionCheckSteps).toHaveBeenCalledWith({
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

    getLabwarePositionCheckSteps(protocolWithTwoPipettes)

    expect(mockgetTwoPipettePositionCheckSteps).toHaveBeenCalledWith({
      primaryPipetteId: leftPipetteId,
      secondaryPipetteId: rightPipetteId,
      labware: protocolWithTwoPipettes.labware,
      labwareDefinitions: protocolWithTwoPipettes.labwareDefinitions,
      modules: protocolWithTwoPipettes.modules,
      commands: protocolWithTwoPipettes.commands,
    })
  })
})
