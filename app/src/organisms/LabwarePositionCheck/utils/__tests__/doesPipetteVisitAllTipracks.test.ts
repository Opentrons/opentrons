import { doesPipetteVisitAllTipracks } from '../doesPipetteVisitAllTipracks'
import _uncastedProtocolMultipleTipracks from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracks.json'
import _uncastedProtocolOneTiprack from '@opentrons/shared-data/protocol/fixtures/6/oneTiprack.json'
import type {
  ProtocolAnalysisOutput,
  LoadedLabware,
} from '@opentrons/shared-data'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7'

// TODO: update these fixtures to be v6 protocols
const protocolMultipleTipracks = (_uncastedProtocolMultipleTipracks as unknown) as ProtocolAnalysisOutput
const labwareDefinitionsMultipleTipracks = _uncastedProtocolMultipleTipracks.labwareDefinitions as {}
const protocolOneTiprack = (_uncastedProtocolOneTiprack as unknown) as ProtocolAnalysisOutput
const labwareDefinitionsOneTiprack = _uncastedProtocolOneTiprack.labwareDefinitions as {}
const labwareWithDefinitionUri = [
  {
    id: 'fixedTrash',
    displayName: 'Trash',
    definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
    loadName: 'opentrons_1_trash_1100ml_fixed',
  },
  {
    id:
      '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
    displayName: 'Opentrons 96 Tip Rack 300 µL',
    definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
    loadName: 'opentrons_96_tiprack_300ul',
  },
  {
    id:
      '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1',
    displayName: 'NEST 12 Well Reservoir 15 mL',
    definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
    loadName: 'nest_12_reservoir_15ml',
  },
  {
    id: 'e24818a0-0042-11ec-8258-f7ffdf5ad45a',
    displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
    definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
    loadName: 'opentrons_96_tiprack_300ul',
  },
] as LoadedLabware[]

describe('doesPipetteVisitAllTipracks', () => {
  it('should return true when the pipette visits both tipracks', () => {
    const pipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const labware = labwareWithDefinitionUri
    const commands: RunTimeCommand[] = protocolMultipleTipracks.commands

    expect(
      doesPipetteVisitAllTipracks(
        pipetteId,
        labware,
        labwareDefinitionsMultipleTipracks,
        commands
      )
    ).toBe(true)
  })
  it('should return false when the pipette does NOT visit all tipracks', () => {
    const pipetteId = '50d23e00-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const labware = labwareWithDefinitionUri
    const commands: RunTimeCommand[] = protocolMultipleTipracks.commands

    expect(
      doesPipetteVisitAllTipracks(
        pipetteId,
        labware,
        labwareDefinitionsMultipleTipracks,
        commands
      )
    ).toBe(false)
  })
  it('should return true when there is only one tiprack and pipette visits it', () => {
    const pipetteId = 'pipetteId' // this is just taken from the protocol fixture
    const labware = [
      {
        id: 'fixedTrash',
        displayName: 'Trash',
        definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
        loadName: 'opentrons_1_trash_1100ml_fixed',
      },
      {
        id: 'tiprackId',
        displayName: 'Opentrons 96 Tip Rack 10 µL',
        definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
        loadName: 'opentrons_96_tiprack_10ul',
      },
      {
        id: 'sourcePlateId',
        displayName: 'Source Plate',
        definitionUri: 'example/plate/1',
        loadName: 'plate',
      },
      {
        id: 'destPlateId',
        displayName: 'Dest Plate',
        definitionUri: 'example/plate/1',
        loadName: 'plate',
      },
    ] as LoadedLabware[]
    const commands: RunTimeCommand[] = protocolOneTiprack.commands

    expect(
      doesPipetteVisitAllTipracks(
        pipetteId,
        labware,
        labwareDefinitionsOneTiprack,
        commands
      )
    ).toBe(true)
  })
})
