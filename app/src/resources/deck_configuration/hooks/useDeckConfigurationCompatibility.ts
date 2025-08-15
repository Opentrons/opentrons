import {
  CutoutConfigAndCompatibility,
  FLEX_ROBOT_TYPE,
  getAddressableAreasInProtocol,
  getCutoutFixturesForCutoutId,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { useNotifyDeckConfigurationQuery } from '../useNotifyDeckConfigurationQuery'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  RobotType,
} from '@opentrons/shared-data'

const DECK_CONFIG_REFETCH_INTERVAL = 5000

/**
 * For a protocol analysis and specified robot, this hook returnsan object
 * per item in the deck configuration that contains the currently configured cutoutId
 * and cutoutFixtureId as well as the addressable areas that the location needs to provide
 * for that protocol to run, and a list of compatible cutout fixture ids that can
 * provide those addressable areas.
 */

export function useDeckConfigurationCompatibility(
  robotType: RobotType,
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
): CutoutConfigAndCompatibility[] {
  const deckConfig =
    useNotifyDeckConfigurationQuery({
      refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
    }).data ?? []
  if (robotType !== FLEX_ROBOT_TYPE) return []
  const deckDef = getDeckDefFromRobotType(robotType)

  const allAddressableAreas =
    protocolAnalysis != null
      ? getAddressableAreasInProtocol(protocolAnalysis, deckDef)
      : []

  return deckConfig.reduce<CutoutConfigAndCompatibility[]>(
    (acc, { cutoutId, cutoutFixtureId }) => {
      // this grabs all fixtures that could mount to the provided cutout ids
      const fixturesThatMountToCutoutId = getCutoutFixturesForCutoutId(
        cutoutId,
        deckDef.cutoutFixtures
      )
      // this filters down the list of addressable areas used in the protocol to
      // find any that have a cutout id that matches the cutoutId in the current
      // iteration of this reduce loop
      const requiredAddressableAreasForCutoutId = allAddressableAreas.filter(
        aa =>
          getCutoutIdForAddressableArea(aa, fixturesThatMountToCutoutId) ===
          cutoutId
      )
      // filtering the list of fixtures that can mount to this cutout id
      // to only include ones that provides every addressable area in the
      // required list requiredAddressableAreasForCutoutId
      const compatibleCutoutFixtureIds = fixturesThatMountToCutoutId
        .filter(cf =>
          requiredAddressableAreasForCutoutId.every(aa =>
            cf.providesAddressableAreas[cutoutId].includes(aa)
          )
        )
        .map(cf => cf.id)

      // for each cutoutId in the current deck config, we'll return an object
      // that contains the current cutoutFixtureId, requiredAddressableAreas for that location that are used
      // in the protocol, and a list of compatibleCutoutFixtureIds that provide those addressable areas
      // this is the object that will be used to determine if the current deck config is compatible with the protocol
      return [
        ...acc,
        {
          cutoutId,
          cutoutFixtureId,
          requiredAddressableAreas: requiredAddressableAreasForCutoutId,
          compatibleCutoutFixtureIds,
        },
      ]
    },
    []
  )
}
