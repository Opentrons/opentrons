import { parseAllAddressableAreas } from '@opentrons/api-client'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotTypeV4,
} from '@opentrons/shared-data'

import {
  getCutoutFixturesForCutoutId,
  getCutoutIdForAddressableArea,
} from './utils'

import type {
  CutoutFixtureId,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { CutoutConfigProtocolSpec } from './utils'

export interface CutoutConfigAndCompatibility extends CutoutConfigProtocolSpec {
  compatibleCutoutFixtureIds: CutoutFixtureId[]
}
export function useDeckConfigurationCompatibility(
  robotType: RobotType,
  protocolCommands: RunTimeCommand[]
): CutoutConfigAndCompatibility[] {
  const deckConfig = useDeckConfigurationQuery().data ?? []
  if (robotType !== FLEX_ROBOT_TYPE) return []
  const deckDef = getDeckDefFromRobotTypeV4(robotType)
  const allAddressableAreas = parseAllAddressableAreas(protocolCommands)
  return deckConfig.reduce<CutoutConfigAndCompatibility[]>(
    (acc, { cutoutId, cutoutFixtureId }) => {
      const fixturesThatMountToCutoutId = getCutoutFixturesForCutoutId(
        cutoutId,
        deckDef.cutoutFixtures
      )
      const requiredAddressableAreasForCutoutId = allAddressableAreas.filter(
        aa =>
          getCutoutIdForAddressableArea(aa, fixturesThatMountToCutoutId) ===
          cutoutId
      )
      return [
        ...acc,
        {
          cutoutId,
          cutoutFixtureId: cutoutFixtureId,
          requiredAddressableAreas: requiredAddressableAreasForCutoutId,
          compatibleCutoutFixtureIds: fixturesThatMountToCutoutId
            .filter(cf =>
              requiredAddressableAreasForCutoutId.every(aa =>
                cf.providesAddressableAreas[cutoutId].includes(aa)
              )
            )
            .map(cf => cf.id),
        },
      ]
    },
    []
  )
}
