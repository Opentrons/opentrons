import { uuid } from '../../utils'

import type { BlowoutInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const blowOutInPlace: CommandCreator<BlowoutInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, flowRate } = args
  const { pipetteEntities } = invariantContext
  const pipette = pipetteEntities[pipetteId]
  const pipettePythonName = pipette.pythonName
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
