import * as errorCreators from '../../errorCreators'
import { indentPyLines, uuid } from '../../utils'

import type { AspirateInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const aspirateInPlace: CommandCreator<AspirateInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume, flowRate, correctionVolume } = args

  const commands = [
    {
      commandType: 'aspirateInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
        flowRate,
        ...(correctionVolume != null ? { correctionVolume } : {}),
      },
    },
  ]
  const errors: CommandCreatorError[] = []
  if (!prevRobotState.tipState.pipettes[pipetteId]) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName: 'aspirate',
        pipette: pipetteId,
      })
    )
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const pythonArgs = [
    `volume=${volume}`,
    // rate= is a ratio in the PAPI, and we have no good way to figure out what
    // flowrate the PAPI has set the pipette to, so we just have to do a division:
    `rate=${flowRate} / ${pipettePythonName}.flow_rate.aspirate`,
    // Note that correction volume is not supported in our public atomic liquid handling APIs
  ]
  const python = `${pipettePythonName}.aspirate(\n${indentPyLines(
    pythonArgs.join(',\n')
  )},\n)`

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  return {
    commands,
    python,
  }
}
