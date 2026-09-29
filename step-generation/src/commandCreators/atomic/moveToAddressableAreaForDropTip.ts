import { getTrashLocationFromAddressableAreaName, uuid } from '../../utils'

import type { MoveToAddressableAreaForDropTipParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

// NOTE (ja 9/29/26): the python is emitted in here for OAIv2's purposes ONLY
// in order to prevent OAIv2 from needing to emit compound commands
// from the IR output to compiler
// otherwise, the compound command dropTipInTrash is emitted for PD
// with the python not being generated directly from moveToAddressableAreaForDropTip.
export const moveToAddressableAreaForDropTip: CommandCreator<
  MoveToAddressableAreaForDropTipParams
> = (args, invariantContext, prevRobotState) => {
  const { pipetteId, addressableAreaName } = args
  const { pipetteEntities, trashBinEntities } = invariantContext

  // No-op if there is no tip
  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    return {
      commands: [],
    }
  }

  const pipettePythonName = pipetteEntities[pipetteId].pythonName
  const trashLocation =
    getTrashLocationFromAddressableAreaName(addressableAreaName)
  const trashBinPythonName = Object.values(trashBinEntities).find(
    trashBin => trashBin.location === trashLocation
  )?.pythonName

  const commands = [
    {
      commandType: 'moveToAddressableAreaForDropTip' as const,
      key: uuid(),
      params: {
        pipetteId,
        addressableAreaName,
        offset: { x: 0, y: 0, z: 0 },
        alternateDropLocation: true,
      },
    },
  ]
  return {
    commands,
    python: `${pipettePythonName}.drop_tip(${trashBinPythonName ?? ''})`,
  }
}
