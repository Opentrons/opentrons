import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  getAddressableAreasInProtocol,
  getCutoutFixturesForCutoutId,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import type {
  CompletedProtocolAnalysis,
  CutoutConfigProtocolSpec,
  CutoutFixtureId,
  ProtocolAnalysisOutput,
  RobotType,
} from '@opentrons/shared-data'

const DECK_CONFIG_REFETCH_INTERVAL = 5000

export interface CutoutConfigAndCompatibility extends CutoutConfigProtocolSpec {
  compatibleCutoutFixtureIds: CutoutFixtureId[]
}
export function useDeckConfigurationCompatibility(
  robotType: RobotType,
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
): CutoutConfigAndCompatibility[] {
  const deckConfig =
    useDeckConfigurationQuery({ refetchInterval: DECK_CONFIG_REFETCH_INTERVAL })
      .data ?? []
  if (robotType !== FLEX_ROBOT_TYPE) return []
  const deckDef = getDeckDefFromRobotType(robotType)
  const allAddressableAreas =
    protocolAnalysis != null
      ? getAddressableAreasInProtocol(protocolAnalysis)
      : []
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
