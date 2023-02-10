import type {
  LoadPipetteRunTimeCommand,
  PipetteName,
} from '@opentrons/shared-data'
import type { PipetteInfo, StoredProtocolAnalysis } from '../Devices/hooks'
import type { Mount } from '../../redux/pipettes/types'

export function getRequiredPipetteForProtocol(
  protocolData: StoredProtocolAnalysis,
  pipetteInfoByMount: { [mount in Mount]: PipetteInfo | null },
  mount: Mount
): PipetteName | null {
  const pipetteInProtocol =
    (protocolData.commands.find(
      (command): command is LoadPipetteRunTimeCommand =>
        command.commandType === 'loadPipette' && command.params.mount === mount
    )?.params.pipetteName as PipetteName | null) ?? null

  //  matching pipette already attached, leave pipette attached
  if (
    pipetteInProtocol != null &&
    pipetteInfoByMount[mount]?.pipetteSpecs.name === pipetteInProtocol
  ) {
    return null
    // protocol doesn't need a pipette but one is attached that is not a 96-channel, leave pipette attached
  } else if (
    pipetteInfoByMount[mount] != null &&
    pipetteInfoByMount[mount]?.pipetteSpecs.name !== 'p1000_96' &&
    pipetteInProtocol === null
  ) {
    return null
    // protocol and pipette attached don't match, change pipette
  } else {
    return pipetteInProtocol
  }
}
