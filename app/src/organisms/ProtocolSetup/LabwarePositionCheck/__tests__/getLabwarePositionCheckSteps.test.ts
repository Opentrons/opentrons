import { when, resetAllWhenMocks } from 'jest-when'
import _uncasted_protocolWithOnePipette from '@opentrons/shared-data/protocol/fixtures/4/simpleV4.json'
import _uncasted_protocolWithTwoPipettes from '@opentrons/shared-data/protocol/fixtures/4/transferSettings.json'
import _uncasted_v6ProtocolWithTwoPipettes from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracks.json'
import { getLabwarePositionCheckSteps } from '../getLabwarePositionCheckSteps'
import { getPrimaryPipetteId } from '../utils/getPrimaryPipetteId'
import { getPipetteWorkflow } from '../utils/getPipetteWorkflow'
import { getOnePipettePositionCheckSteps } from '../utils/getOnePipettePositionCheckSteps'
import { getTwoPipettePositionCheckSteps } from '../utils/getTwoPipettePositionCheckSteps'

import type { ProtocolFile } from '@opentrons/shared-data'

// TODO: update these fixtures to be v6 protocols
const protocolWithOnePipette = (_uncasted_protocolWithOnePipette as unknown) as ProtocolFile<any>
const protocolWithTwoPipettes = (_uncasted_protocolWithTwoPipettes as unknown) as ProtocolFile<any>
const v6ProtocolWithTwoPipettes = (_uncasted_v6ProtocolWithTwoPipettes as unknown) as ProtocolFile<any>

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
  it('should generate commands with the one pipette workflow when there is only one pipette in the protocol', () => {
    const mockPipette = protocolWithOnePipette.pipettes.pipetteId
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

    expect(mockgetOnePipettePositionCheckSteps).toHaveBeenCalledWith({
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
    const leftPipette = v6ProtocolWithTwoPipettes.pipettes[leftPipetteId]
    const commandsWithoutLeftPipettePickupTipCommand = v6ProtocolWithTwoPipettes.commands.filter(
      command =>
        !(
          command.commandType === 'pickUpTip' &&
          command.params.pipetteId === leftPipetteId
        )
    )

    const protocolWithTwoPipettesWithOnlyOneBeingUsed = {
      ...v6ProtocolWithTwoPipettes,
      commands: commandsWithoutLeftPipettePickupTipCommand,
    }

    const pipettesBeingUsedInProtocol: ProtocolFile<any>['pipettes'] = {
      '50d23e00-0042-11ec-8258-f7ffdf5ad45a': { name: 'p300_single_gen2' },
    }

    when(mockGetPrimaryPipetteId)
      .calledWith(
        pipettesBeingUsedInProtocol,
        protocolWithTwoPipettesWithOnlyOneBeingUsed.commands
      )
      .mockReturnValue(rightPipetteId)

    when(mockGetPipetteWorkflow)
      .calledWith({
        pipetteNames: [leftPipette.name],
        primaryPipetteId: rightPipetteId,
        labware: protocolWithTwoPipettesWithOnlyOneBeingUsed.labware,
        labwareDefinitions:
          protocolWithTwoPipettesWithOnlyOneBeingUsed.labwareDefinitions,
        commands: protocolWithTwoPipettesWithOnlyOneBeingUsed.commands,
      })
      .mockReturnValue(1)

    getLabwarePositionCheckSteps(protocolWithTwoPipettesWithOnlyOneBeingUsed)

    expect(mockgetOnePipettePositionCheckSteps).toHaveBeenCalledWith({
      primaryPipetteId: rightPipetteId,
      labware: protocolWithTwoPipettesWithOnlyOneBeingUsed.labware,
      labwareDefinitions:
        protocolWithTwoPipettesWithOnlyOneBeingUsed.labwareDefinitions,
      modules: protocolWithTwoPipettesWithOnlyOneBeingUsed.modules,
      commands: protocolWithTwoPipettesWithOnlyOneBeingUsed.commands,
    })
  })
  it('should generate commands with the two pipette workflow', () => {
    const leftPipetteId = '3dff4f90-3412-11eb-ad93-ed232a2337cf'
    const rightPipetteId = '4da579b0-a9bf-11eb-bce6-9f1d5b9c1a1b'
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
