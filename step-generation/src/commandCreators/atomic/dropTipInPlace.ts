import * as errorCreators from '../../errorCreators'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type { CommandCreator } from '../../types'

// NOTE (ja 9/29/26): the python is emitted in here for OAIv2's purposes ONLY
// in order to prevent OAIv2 from needing to emit compound commands
// from the IR output to compiler
// otherwise, the compound command dropTipInTrash is emitted for PD
// with the python not being generated directly from dropTipInPlace via
// curryWithoutPython(dropTipInPlace)
export const dropTipInPlace: CommandCreator<{ pipetteId: string }> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  if (pipetteId == null) {
    return {
      errors: [
        errorCreators.invalidRuntimeParameter({
          parameterName: args.pipetteId,
        }),
      ],
    }
  }
  // No-op if there is no tip
  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    return {
      commands: [],
    }
  }

  const { pipetteEntities, trashBinEntities, wasteChuteEntities } =
    invariantContext
  const pipettePythonName = pipetteEntities[pipetteId].pythonName
  const entityId = prevRobotState.pipettes[pipetteId]?.entityId ?? ''
  const trashBin = trashBinEntities[entityId]
  const wasteChute = wasteChuteEntities[entityId]
  const dropTipArgs =
    trashBin != null
      ? `${trashBin.pythonName}, alternate_drop_location=True`
      : (wasteChute?.pythonName ?? '')

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
    python: `${pipettePythonName}.drop_tip(${dropTipArgs})`,
  }
}
