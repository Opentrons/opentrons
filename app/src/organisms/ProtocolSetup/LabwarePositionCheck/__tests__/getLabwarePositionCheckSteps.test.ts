import pick from 'lodash/pick'
import { when, resetAllWhenMocks } from 'jest-when'
import _uncasted_v6ProtocolWithTwoPipettes from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracks.json'
import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import { getPrimaryPipetteId } from '../utils/getPrimaryPipetteId'
import { getPipetteWorkflow } from '../utils/getPipetteWorkflow'
import { getOnePipettePositionCheckSteps } from '../utils/getOnePipettePositionCheckSteps'
import { getTwoPipettePositionCheckSteps } from '../utils/getTwoPipettePositionCheckSteps'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

const protocolWithOnePipette = ({
  ..._uncasted_v6ProtocolWithTwoPipettes,
  pipettes: pick(
    _uncasted_v6ProtocolWithTwoPipettes.pipettes,
    Object.keys(_uncasted_v6ProtocolWithTwoPipettes.pipettes)[0]
  ),
} as unknown) as ProtocolAnalysisFile
const protocolWithTwoPipettes = (_uncasted_v6ProtocolWithTwoPipettes as unknown) as ProtocolAnalysisFile

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
const mockGetOnePipettePositionCheckSteps = getOnePipettePositionCheckSteps as jest.MockedFunction<
  typeof getOnePipettePositionCheckSteps
>
const mockGetTwoPipettePositionCheckSteps = getTwoPipettePositionCheckSteps as jest.MockedFunction<
  typeof getTwoPipettePositionCheckSteps
>

describe('getLabwarePositionCheckSteps', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should generate commands with the one pipette workflow when there is only one pipette in the protocol', () => {
    const mockPipette =
      protocolWithOnePipette.pipettes[
        Object.keys(protocolWithOnePipette.pipettes)[0]
      ]
    when(mockGetPrimaryPipetteId)
      .calledWith(
        protocolWithOnePipette.pipettes,
        protocolWithOnePipette.commands
      )
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

    expect(mockGetOnePipettePositionCheckSteps).toHaveBeenCalledWith({
      primaryPipetteId: 'pipetteId',
      labware: protocolWithOnePipette.labware,
      labwareDefinitions: protocolWithOnePipette.labwareDefinitions,
      modules: protocolWithOnePipette.modules,
      commands: protocolWithOnePipette.commands,
    })
  })
  it('should generate commands with the one pipette workflow when there are two pipettes in the protocol but only one is used', () => {
    const leftPipetteId = '50d23e00-0042-11ec-8258-f7ffdf5ad45a'
    const rightPipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a'
    const rightPipette = protocolWithTwoPipettes.pipettes[rightPipetteId]
    const commandsWithoutLeftPipettePickupTipCommand = protocolWithTwoPipettes.commands.filter(
      command =>
        !(
          command.commandType === 'pickUpTip' &&
          command.params.pipetteId === leftPipetteId
        )
    )

    const protocolWithTwoPipettesWithOnlyOneBeingUsed = {
      ...protocolWithTwoPipettes,
      commands: commandsWithoutLeftPipettePickupTipCommand,
    }

    const pipettesBeingUsedInProtocol: ProtocolAnalysisFile['pipettes'] = {
      [rightPipetteId]: rightPipette,
    }

    when(mockGetPrimaryPipetteId)
      .calledWith(
        pipettesBeingUsedInProtocol,
        protocolWithTwoPipettesWithOnlyOneBeingUsed.commands
      )
      .mockReturnValue(rightPipetteId)

    when(mockGetPipetteWorkflow)
      .calledWith({
        pipetteNames: [rightPipette.name],
        primaryPipetteId: rightPipetteId,
        labware: protocolWithTwoPipettesWithOnlyOneBeingUsed.labware,
        labwareDefinitions:
          protocolWithTwoPipettesWithOnlyOneBeingUsed.labwareDefinitions,
        commands: protocolWithTwoPipettesWithOnlyOneBeingUsed.commands,
      })
      .mockReturnValue(1)

    getLabwarePositionCheckSteps(protocolWithTwoPipettesWithOnlyOneBeingUsed)

    expect(mockGetOnePipettePositionCheckSteps).toHaveBeenCalledWith({
      primaryPipetteId: rightPipetteId,
      labware: protocolWithTwoPipettesWithOnlyOneBeingUsed.labware,
      labwareDefinitions:
        protocolWithTwoPipettesWithOnlyOneBeingUsed.labwareDefinitions,
      modules: protocolWithTwoPipettesWithOnlyOneBeingUsed.modules,
      commands: protocolWithTwoPipettesWithOnlyOneBeingUsed.commands,
    })
  })
  it('should generate commands with the two pipette workflow', () => {
    const leftPipetteId = '50d23e00-0042-11ec-8258-f7ffdf5ad45a'
    const rightPipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a'
    const leftPipette = protocolWithTwoPipettes.pipettes[leftPipetteId]
    const rightPipette = protocolWithTwoPipettes.pipettes[rightPipetteId]

    when(mockGetPrimaryPipetteId)
      .calledWith(
        protocolWithTwoPipettes.pipettes,
        protocolWithTwoPipettes.commands
      )
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

    expect(mockGetTwoPipettePositionCheckSteps).toHaveBeenCalledWith({
      primaryPipetteId: leftPipetteId,
      secondaryPipetteId: rightPipetteId,
      labware: protocolWithTwoPipettes.labware,
      labwareDefinitions: protocolWithTwoPipettes.labwareDefinitions,
      modules: protocolWithTwoPipettes.modules,
      commands: protocolWithTwoPipettes.commands,
    })
  })
})
