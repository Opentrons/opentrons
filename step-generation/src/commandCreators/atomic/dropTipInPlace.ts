import { uuid } from '../../utils'

import type { DropTipInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

// NOTE (ja 9/29/26): the python is emitted in here for OAIv2's purposes ONLY
// in order to prevent OAIv2 from needing to emit compound commands
// from the IR output to compiler
// otherwise, the compound command dropTipInTrash is emitted for PD
// with the python not being generated directly from dropTipInPlace via
// curryWithoutPython(dropTipInPlace)
export const dropTipInPlace: CommandCreator<DropTipInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId } = args
  // No-op if there is no tip
  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    return {
      commands: [],
    }
  }

  const { pipetteEntities, trashBinEntities, wasteChuteEntities } =
    invariantContext
  const pipettePythonName = pipetteEntities[pipetteId].pythonName
  const entityId = prevRobotState.pipettes[pipetteId]?.entityId
  const fixturePythonName =
    entityId != null
      ? (trashBinEntities[entityId]?.pythonName ??
        wasteChuteEntities[entityId]?.pythonName)
      : undefined

  const commands = [
    {
      commandType: 'dropTipInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
      },
    },
  ]
  return {
    commands,
    python: `${pipettePythonName}.drop_tip(${fixturePythonName ?? ''})`,
  }
}
