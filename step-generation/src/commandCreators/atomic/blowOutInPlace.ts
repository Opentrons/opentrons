import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'

import type { BlowoutInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const blowOutInPlace: CommandCreator<BlowoutInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, flowRate } = args

  const errors: CommandCreatorError[] = []

  if (!prevRobotState.tipState.pipettes[pipetteId]) {
    errors.push(
      errorCreators.noTipOnPipette({
        actionName: 'blowout',
        pipette: pipetteId,
      })
    )
  }

  if (errors.length > 0) {
    return {
      errors,
    }
  }

  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName

  const commands = [
    {
      commandType: 'blowOutInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        flowRate,
      },
    },
  ]
  return {
    commands,
    python:
      // blow_out() blows out in place if no location= is specified
      `${pipettePythonName}.flow_rate.blow_out = ${flowRate}\n` +
      `${pipettePythonName}.blow_out()`,
  }
}
