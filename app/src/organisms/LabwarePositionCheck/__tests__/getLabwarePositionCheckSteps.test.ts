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
  labware: [
    {
      id: 'fixedTrash',
      loadName: 'opentrons_1_trash_1100ml_fixed',
      displayName: 'Trash',
      definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
    },
    {
      id:
        '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
      loadName: 'opentrons_96_tiprack_300ul',
      displayName: 'Opentrons 96 Tip Rack 300 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
    },
    {
      id:
        '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1',
      loadName: 'nest_12_reservoir_15ml',
      displayName: 'NEST 12 Well Reservoir 15 mL',
      definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
    },
    {
      id: 'e24818a0-0042-11ec-8258-f7ffdf5ad45a',
      loadName: 'opentrons_96_tiprack_300ul',
      displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
      definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
    },
  ],
  pipettes: [
    {
      pipetteName: 'p300_single_gen2',
      id: '50d23e00-0042-11ec-8258-f7ffdf5ad45a',
    },
  ],
} as unknown) as ProtocolAnalysisFile
const protocolWithTwoPipettes = ({
  ..._uncasted_v6ProtocolWithTwoPipettes,
  pipettes: [
    {
      pipetteName: 'p300_single_gen2',
      id: '50d23e00-0042-11ec-8258-f7ffdf5ad45a',
    },
    {
      pipetteName: 'p300_multi',
      id: 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a',
    },
  ],
  labware: [
    {
      id: 'fixedTrash',
      loadName: 'opentrons_1_trash_1100ml_fixed',
      displayName: 'Trash',
      definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
    },
    {
      id:
        '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
      loadName: 'opentrons_96_tiprack_300ul',
      displayName: 'Opentrons 96 Tip Rack 300 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
    },
    {
      id:
        '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1',
      loadName: 'nest_12_reservoir_15ml',
      displayName: 'NEST 12 Well Reservoir 15 mL',
      definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
    },
    {
      id: 'e24818a0-0042-11ec-8258-f7ffdf5ad45a',
      loadName: 'opentrons_96_tiprack_300ul',
      displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
      definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
    },
  ],
} as unknown) as ProtocolAnalysisFile

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
    mockGetPrimaryPipetteId.mockReturnValue('pipetteId')
    when(mockGetPipetteWorkflow)
      .calledWith({
        //  @ts-expect-error
        pipetteNames: [protocolWithOnePipette.pipettes[0].pipetteName],
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
  it('should not include labware that are tip racks and are unused in protocol', () => {
    mockGetPrimaryPipetteId.mockReturnValue('pipetteId')

    const protocolWithUnusedTipRack = {
      ...protocolWithOnePipette,
      labware: [
        {
          id: 'fixedTrash',
          loadName: 'opentrons_1_trash_1100ml_fixed',
          displayName: 'Trash',
          definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
        },
        {
          id:
            '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
          loadName: 'opentrons_96_tiprack_300ul',
          displayName: 'Opentrons 96 Tip Rack 300 µL',
          definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
        },
        {
          id:
            '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1',
          loadName: 'nest_12_reservoir_15ml',
          displayName: 'NEST 12 Well Reservoir 15 mL',
          definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
        },
        {
          id: 'e24818a0-0042-11ec-8258-f7ffdf5ad45a',
          loadName: 'opentrons_96_tiprack_300ul',
          displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
          definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
        },
        {
          id: 'unusedTipRackId',
          definitionUri: 'bogusDefinitionUri',
          loadName: 'someLoadname',
        },
      ],
      labwareDefinitions: {
        ...protocolWithOnePipette.labwareDefinitions,
        bogusDefinitionId: { parameters: { isTiprack: true } } as any,
      },
    }

    when(mockGetPipetteWorkflow)
      .calledWith({
        //  @ts-expect-error
        pipetteNames: [protocolWithOnePipette.pipettes[0].pipetteName],
        primaryPipetteId: 'pipetteId',
        labware: protocolWithOnePipette.labware,
        labwareDefinitions: protocolWithOnePipette.labwareDefinitions,
        commands: protocolWithOnePipette.commands,
      })
      .mockReturnValue(1)

    //  @ts-expect-error
    getLabwarePositionCheckSteps(protocolWithUnusedTipRack)

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
    const rightPipette = protocolWithTwoPipettes.pipettes[1]
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

    mockGetPrimaryPipetteId.mockReturnValue(rightPipetteId)

    when(mockGetPipetteWorkflow)
      .calledWith({
        //  @ts-expect-error
        pipetteNames: [rightPipette.pipetteName],
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
    const leftPipette = protocolWithTwoPipettes.pipettes[0]
    const rightPipette = protocolWithTwoPipettes.pipettes[1]

    mockGetPrimaryPipetteId.mockReturnValue(leftPipetteId)

    when(mockGetPipetteWorkflow)
      .calledWith({
        //  @ts-expect-error
        pipetteNames: [leftPipette.pipetteName, rightPipette.pipetteName],
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
