import { pipetteDoesNotExist } from '../../errorCreators'
import { uuid } from '../../utils'

import type { CommandCreator, CommandCreatorError } from '../../types'
import type { AirGapInPlaceParams } from '@opentrons/shared-data'

export const airGapInPlace: CommandCreator<AirGapInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { flowRate, pipetteId, volume } = args
  const errors: CommandCreatorError[] = []
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId]?.spec

  if (!pipetteSpec) {
    errors.push(
      pipetteDoesNotExist({
        pipette: pipetteId,
      })
    )
  }

  const commands = [
    {
      commandType: 'airGapInPlace' as const,
      key: uuid(),
      params: {
        flowRate,
        pipetteId,
        volume,
      },
    },
  ]
  return {
    commands,
  }
}
