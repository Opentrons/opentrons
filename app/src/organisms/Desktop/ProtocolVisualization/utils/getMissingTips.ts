import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'

import type { WellGroup } from '@opentrons/components'
import type { RobotState } from '@opentrons/step-generation'

export const getMissingTips = (
  tipState: RobotState['tipState'],
  labwareId: string
): WellGroup | null => {
  const missingTipsByLabwareId =
    tipState &&
    mapValues(tipState.tipracks, tipMap =>
      reduce(
        tipMap,
        (acc, hasTip, wellName): WellGroup =>
          hasTip ? acc : { ...acc, [wellName]: null },
        {}
      )
    )
  const missingTips = missingTipsByLabwareId
    ? missingTipsByLabwareId[labwareId]
    : null

  return missingTips
}
