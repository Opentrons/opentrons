import {
  FLEX_ROBOT_TYPE,
  getAddressableAreasInProtocol,
  getCutoutFixturesForCutoutId,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  getLabwareDisplayName,
  SINGLE_SLOT_FIXTURES,
} from '@opentrons/shared-data'

import { getInitialAndMovedLabwareInSlots } from '/app/transformations/analysis'

import { useNotifyDeckConfigurationQuery } from '../useNotifyDeckConfigurationQuery'

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
    useNotifyDeckConfigurationQuery({
      refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
    }).data ?? []
  if (robotType !== FLEX_ROBOT_TYPE) return []
  const deckDef = getDeckDefFromRobotType(robotType)

  const allAddressableAreas =
    protocolAnalysis != null
      ? getAddressableAreasInProtocol(protocolAnalysis, deckDef)
      : []
  const labwareInSlots =
    protocolAnalysis != null
      ? getInitialAndMovedLabwareInSlots(protocolAnalysis)
      : []

  return deckConfig.reduce<CutoutConfigAndCompatibility[]>(
    (acc, { cutoutId, cutoutFixtureId }) => {
      // this grabs all fixtures that could mount to the provided cutout ids
      // cutout fixture array return type
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

      // update this to not care arbout the specific labware that is causing the conflict
      // just the slot location that needs to be empty --> need to verify this change with 
      // design

      // get the on-deck labware name for a missing single-slot addressable area
      const missingSingleSlotLabware =
        cutoutFixtureId != null &&
        // fixture mismatch
        !compatibleCutoutFixtureIds.includes(cutoutFixtureId) &&
        compatibleCutoutFixtureIds[0] != null &&
        // compatible fixture is single-slot
        SINGLE_SLOT_FIXTURES.includes(compatibleCutoutFixtureIds[0])
          ? labwareInSlots.find(
              ({ location }) =>
                // match the addressable area to an on-deck labware
                requiredAddressableAreasForCutoutId[0] === location.slotName
            )
          : null

      const missingLabwareDisplayName =
        missingSingleSlotLabware != null
          ? missingSingleSlotLabware.labwareNickName ??
            getLabwareDisplayName(missingSingleSlotLabware.labwareDef) ??
            null
          : null
      

      // this is looping through the current deck config
      // cutoutId, cutoutFixtureId from the deck config
      // requiredAddressableAreas: list of addressable areas used in the protocol that are provided by 
      // this cutoutId and cutoutFixtureId
      // compatibleCutoutFixtureIds: all fixtureids that are compatible with the current deck def and cutout id combo, not checking 
      // for protocol compatibility here
      return [
        ...acc,
        {
          cutoutId,
          cutoutFixtureId,
          requiredAddressableAreas: requiredAddressableAreasForCutoutId,
          compatibleCutoutFixtureIds,
          missingLabwareDisplayName,
        },
      ]
    },
    []
  )
}


// for every entry in the current deck config, we'll get the above object
// is matched fixture is checking to see if the cutoutFixtureId is in the 
// compatibleCutoutFixtureIds list
