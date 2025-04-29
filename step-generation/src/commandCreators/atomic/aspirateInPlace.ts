import { indentPyLines, uuid } from '../../utils'

import type { AspirateInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const aspirateInPlace: CommandCreator<AspirateInPlaceParams> = (
  args,
  invariantContext,
  robotState
) => {
  const { pipetteId, volume, flowRate } = args

  const commands = [
    {
      commandType: 'aspirateInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
        flowRate,
      },
    },
  ]
  console.log(pipetteId)
  console.log(invariantContext.pipetteEntities)

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const pythonArgs = [
    `volume=${volume}`,
    // rate= is a ratio in the PAPI, and we have no good way to figure out what
    // flowrate the PAPI has set the pipette to, so we just have to do a division:
    `rate=${flowRate} / ${pipettePythonName}.flow_rate.aspirate`,
  ]
  const python = `${pipettePythonName}.aspirate(\n${indentPyLines(
    pythonArgs.join(',\n')
  )},\n)`

  return {
    commands,
    python,
  }
}
