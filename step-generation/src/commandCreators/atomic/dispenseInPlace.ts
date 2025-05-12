import * as errorCreators from '../../errorCreators'
import { indentPyLines, uuid } from '../../utils'

import type { DispenseInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const dispenseInPlace: CommandCreator<DispenseInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume, flowRate, pushOut } = args

  const errors: CommandCreatorError[] = []
  if (!prevRobotState.tipState.pipettes[pipetteId]) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName: 'dispense',
        pipette: pipetteId,
      })
    )
  }

  const commands = [
    {
      commandType: 'dispenseInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
        flowRate,
        ...(pushOut != null ? { pushOut } : {}),
      },
    },
  ]
  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName
  const pythonArgs = [
    `volume=${volume}`,
    // rate= is a ratio in the PAPI, and we have no good way to figure out what
    // flowrate the PAPI has set the pipette to, so we just have to do a division:
    `rate=${flowRate} / ${pipettePythonName}.flow_rate.dispense`,
    ...(pushOut != null ? [`push_out=${pushOut}`] : []),
  ]
  const python = `${pipettePythonName}.dispense(\n${indentPyLines(
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
