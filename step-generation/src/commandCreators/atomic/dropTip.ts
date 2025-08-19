import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'

import type { CreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

interface DropTipArgs {
  pipette: string
  wellName?: string
  dropTipLocation?: string
  isReturnTip?: boolean
}

/**
 * Note that this command creator is now only applied to dropping tips into tipracks
 * For dropping tips into trash bins or waste chutes, use dropTipInWasteChute or dropTipInTrashBin
 */
export const dropTip: CommandCreator<DropTipArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipette, dropTipLocation, wellName, isReturnTip } = args
  // No-op if there is no tip
  if (!prevRobotState.tipState.pipettes[pipette]?.hasTip) {
    return {
      commands: [],
    }
  }

  const mostRecentlyAccessedTiprackId =
    prevRobotState.pipettes[pipette].tiprackId
  const mostRecentlyAccessedTipWell = prevRobotState.pipettes[pipette].tipWell
  const mostRecentlyAccessedTiprackLabware = Object.values(
    invariantContext.labwareEntities
  ).find(({ id }) => id === mostRecentlyAccessedTiprackId)
  const isReturnLocationKnown =
    mostRecentlyAccessedTiprackLabware != null &&
    mostRecentlyAccessedTipWell != null
  if (isReturnTip && !isReturnLocationKnown) {
    return {
      errors: [errorCreators.returnTipUnavailable()],
    }
  }
  let python: string | null = null
  if (isReturnTip && isReturnLocationKnown) {
    const pythonPipette = invariantContext.pipetteEntities[pipette].pythonName
    const pythonLabware = mostRecentlyAccessedTiprackLabware.pythonName
    const pythonLocation = `${pythonLabware}.wells_by_name()["${mostRecentlyAccessedTipWell}"]`
    python = `${pythonPipette}.drop_tip(location=${pythonLocation})`
  }

  let commands: CreateCommand[] = []
  if (isReturnTip) {
    if (
      mostRecentlyAccessedTiprackId == null ||
      mostRecentlyAccessedTipWell == null
    ) {
      return {
        errors: [errorCreators.returnTipUnavailable()],
      }
    } else {
      commands = [
        {
          commandType: 'dropTip' as const,
          key: uuid(),
          params: {
            pipetteId: pipette,
            labwareId: mostRecentlyAccessedTiprackId,
            wellName: mostRecentlyAccessedTipWell,
          },
        },
      ]
    }
  } else {
    if (dropTipLocation == null || wellName == null) {
      return {
        errors: [errorCreators.dropTipLocationDoesNotExist()],
      }
    }
    commands = [
      {
        commandType: 'dropTip' as const,
        key: uuid(),
        params: {
          pipetteId: pipette,
          labwareId: dropTipLocation,
          wellName,
        },
      },
    ]
  }

  return {
    commands,
    ...(python != null ? { python } : {}),
  }
}
