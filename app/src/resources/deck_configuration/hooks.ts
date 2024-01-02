import { getLabwareOnDeck } from '@opentrons/components'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  getAddressableAreasInProtocol,
  getCutoutFixturesForCutoutId,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  SINGLE_SLOT_FIXTURES,
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
  // the missing on-deck labware display name for a single slot cutout
  missingLabwareDisplayName: string | null
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
      ? getAddressableAreasInProtocol(protocolAnalysis, deckDef)
      : []
  const labwareOnDeck =
    protocolAnalysis != null ? getLabwareOnDeck(protocolAnalysis) : []

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

      const compatibleCutoutFixtureIds = fixturesThatMountToCutoutId
        .filter(cf =>
          requiredAddressableAreasForCutoutId.every(aa =>
            cf.providesAddressableAreas[cutoutId].includes(aa)
          )
        )
        .map(cf => cf.id)

      // get the on-deck labware name for a missing single-slot addressable area
      const missingSingleSlotLabware =
        cutoutFixtureId != null &&
        // fixture mismatch
        !compatibleCutoutFixtureIds.includes(cutoutFixtureId) &&
        compatibleCutoutFixtureIds[0] != null &&
        // compatible fixture is single-slot
        SINGLE_SLOT_FIXTURES.includes(compatibleCutoutFixtureIds[0])
          ? labwareOnDeck.find(
              ({ labwareLocation }) =>
                labwareLocation !== 'offDeck' &&
                // match the addressable area to an on-deck labware
                (('slotName' in labwareLocation &&
                  requiredAddressableAreasForCutoutId[0] ===
                    labwareLocation.slotName) ||
                  ('addressableAreaName' in labwareLocation &&
                    requiredAddressableAreasForCutoutId[0] ===
                      labwareLocation.addressableAreaName))
            )
          : null

      const missingLabwareDisplayName =
        missingSingleSlotLabware?.displayName ?? null

      return [
        ...acc,
        {
          cutoutId,
          cutoutFixtureId: cutoutFixtureId,
          requiredAddressableAreas: requiredAddressableAreasForCutoutId,
          compatibleCutoutFixtureIds,
          missingLabwareDisplayName,
        },
      ]
    },
    []
  )
}
