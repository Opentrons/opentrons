import { doesPipetteVisitAllTipracks } from '../doesPipetteVisitAllTipracks'
import _uncastedProtocolMultipleTipracks from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracks.json'
import _uncastedProtocolOneTiprack from '@opentrons/shared-data/protocol/fixtures/6/oneTiprack.json'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data/protocol'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

// TODO: update these fixtures to be v6 protocols
const protocolMultipleTipracks = (_uncastedProtocolMultipleTipracks as unknown) as ProtocolAnalysisFile
const protocolOneTiprack = (_uncastedProtocolOneTiprack as unknown) as ProtocolAnalysisFile
const labwareWithDefinitionUri = {
  fixedTrash: {
    displayName: 'Trash',
    definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
  },
  '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1': {
    displayName: 'Opentrons 96 Tip Rack 300 µL',
    definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
  },
  '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1': {
    displayName: 'NEST 12 Well Reservoir 15 mL',
    definitionUri: 'opentrons/nest_12_reservoir_15ml/1',
  },
  'e24818a0-0042-11ec-8258-f7ffdf5ad45a': {
    displayName: 'Opentrons 96 Tip Rack 300 µL (1)',
    definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
  },
}

describe('doesPipetteVisitAllTipracks', () => {
  it('should return true when the pipette visits both tipracks', () => {
    const pipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const labware = labwareWithDefinitionUri
    const labwareDefinitions = protocolMultipleTipracks.labwareDefinitions
    const commands: RunTimeCommand[] = protocolMultipleTipracks.commands

    expect(
      doesPipetteVisitAllTipracks(
        pipetteId,
        //  @ts-expect-error
        labware,
        labwareDefinitions,
        commands
      )
    ).toBe(true)
  })
  it('should return false when the pipette does NOT visit all tipracks', () => {
    const pipetteId = '50d23e00-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const labware = labwareWithDefinitionUri
    const labwareDefinitions = protocolMultipleTipracks.labwareDefinitions
    const commands: RunTimeCommand[] = protocolMultipleTipracks.commands

    expect(
      doesPipetteVisitAllTipracks(
        pipetteId,
        //  @ts-expect-error
        labware,
        labwareDefinitions,
        commands
      )
    ).toBe(false)
  })
  it('should return true when there is only one tiprack and pipette visits it', () => {
    const pipetteId = 'pipetteId' // this is just taken from the protocol fixture
    const labware = {
      fixedTrash: {
        displayName: 'Trash',
        definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
      },
      tiprackId: {
        displayName: 'Opentrons 96 Tip Rack 10 µL',
        definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
      },
      sourcePlateId: {
        displayName: 'Source Plate',
        definitionUri: 'example/plate/1',
      },
      destPlateId: {
        displayName: 'Dest Plate',
        definitionUri: 'example/plate/1',
      },
    }
    const labwareDefinitions = protocolOneTiprack.labwareDefinitions
    const commands: RunTimeCommand[] = protocolOneTiprack.commands

    expect(
      doesPipetteVisitAllTipracks(
        pipetteId,
        //  @ts-expect-error
        labware,
        labwareDefinitions,
        commands
      )
    ).toBe(true)
  })
})
