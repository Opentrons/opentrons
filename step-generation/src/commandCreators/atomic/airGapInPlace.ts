import { pipetteDoesNotExist } from '../../errorCreators'
import { uuid } from '../../utils'

import type { AirGapInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const airGapInPlace: CommandCreator<AirGapInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { flowRate, pipetteId, volume, correctionVolume } = args
  const errors: CommandCreatorError[] = []
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId]?.spec
  if (!pipetteSpec) {
    errors.push(
      pipetteDoesNotExist({
        pipette: pipetteId,
      })
    )
  }
  const pipettePythonName =
    invariantContext.pipetteEntities[pipetteId].pythonName

  const commands = [
    {
      commandType: 'airGapInPlace' as const,
      key: uuid(),
      params: {
        flowRate,
        pipetteId,
        volume,
        ...(correctionVolume != null ? { correctionVolume } : {}),
      },
    },
  ]
  return {
    commands,
    python: `${pipettePythonName}.air_gap(${[
      `volume=${volume}`,
      `in_place=True`,
      `flow_rate=${flowRate}`,
      // Note that correction volume is not supported in our public atomic liquid handling APIs
    ].join(', ')})`,
  }
}
