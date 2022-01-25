import { doesPipetteVisitAllTipracks } from '../doesPipetteVisitAllTipracks'
import _uncastedProtocolMultipleTipracks from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracks.json'
import _uncastedProtocolOneTiprack from '@opentrons/shared-data/protocol/fixtures/6/oneTiprack.json'
import type { ProtocolFile } from '@opentrons/shared-data/protocol'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

// TODO: update these fixtures to be v6 protocols
const protocolMultipleTipracks = (_uncastedProtocolMultipleTipracks as unknown) as ProtocolFile<{}>
const protocolOneTiprack = (_uncastedProtocolOneTiprack as unknown) as ProtocolFile<{}>

describe('doesPipetteVisitAllTipracks', () => {
  it('should return true when the pipette visits both tipracks', () => {
    const pipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const labware = protocolMultipleTipracks.labware
    const labwareDefinitions = protocolMultipleTipracks.labwareDefinitions
    const commands: RunTimeCommand[] = protocolMultipleTipracks.commands

    expect(
      doesPipetteVisitAllTipracks(
        pipetteId,
        labware,
        labwareDefinitions,
        commands
      )
    ).toBe(true)
  })
  it('should return false when the pipette does NOT visit all tipracks', () => {
    const pipetteId = '50d23e00-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const labware = protocolMultipleTipracks.labware
    const labwareDefinitions = protocolMultipleTipracks.labwareDefinitions
    const commands: RunTimeCommand[] = protocolMultipleTipracks.commands

    expect(
      doesPipetteVisitAllTipracks(
        pipetteId,
        labware,
        labwareDefinitions,
        commands
      )
    ).toBe(false)
  })
  it('should return true when there is only one tiprack and pipette visits it', () => {
    const pipetteId = 'pipetteId' // this is just taken from the protocol fixture
    const labware = protocolOneTiprack.labware
    const labwareDefinitions = protocolOneTiprack.labwareDefinitions
    const commands: RunTimeCommand[] = protocolOneTiprack.commands

    expect(
      doesPipetteVisitAllTipracks(
        pipetteId,
        labware,
        labwareDefinitions,
        commands
      )
    ).toBe(true)
  })
})
