import { doesPipetteVisitAllTipracks } from '../utils/doesPipetteVisitAllTipracks'
import _uncastedProtocolMultipleTipracks from '@opentrons/shared-data/protocol/fixtures/5/multipleTipracks.json'
import _uncastedProtocolOneTiprack from '@opentrons/shared-data/protocol/fixtures/5/simpleV5.json'
import type { ProtocolFileV5 } from '@opentrons/shared-data'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'

const protocolMultipleTipracks = _uncastedProtocolMultipleTipracks as ProtocolFileV5<any>
const protocolOneTiprack = _uncastedProtocolOneTiprack as ProtocolFileV5<any>

describe('doesPipetteVisitAllTipracks', () => {
  it('should return true when the pipette visits both tipracks', () => {
    const pipetteId = 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a' // this is just taken from the protocol fixture
    const labware = protocolMultipleTipracks.labware
    const labwareDefinitions = protocolMultipleTipracks.labwareDefinitions
    const commands: Command[] = protocolMultipleTipracks.commands

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
    const commands: Command[] = protocolMultipleTipracks.commands

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
    const commands: Command[] = protocolOneTiprack.commands

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
