import head from 'lodash/head'

import {
  getDeckDefFromRobotType,
  OT2_ROBOT_TYPE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import type {
  RobotType,
  CutoutConfig,
  AddressableAreaName,
} from '@opentrons/shared-data'
import type { ValidDropTipBlowoutLocation } from '../types'

export type DropTipBlowoutSlotName =
  | AddressableAreaName
  | 'CHOOSE_DECK_LOCATION'

export interface DropTipBlowoutLocationDetails {
  slotName: DropTipBlowoutSlotName
  location: ValidDropTipBlowoutLocation
}

// TODO(jh 09-25-24): Add "Return to labware" support once the server returns relevant labware.

// Returns valid location options for executing tip commands.
export function useDropTipLocations(
  robotType: RobotType
): DropTipBlowoutLocationDetails[] {
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []
  const deckDef = getDeckDefFromRobotType(robotType)

  const createLocation = (
    cutoutConfig: CutoutConfig,
    validLocation: ValidDropTipBlowoutLocation
  ): DropTipBlowoutLocationDetails => {
    const cutoutAAs = deckDef.cutoutFixtures.find(
      fixture => cutoutConfig.cutoutId in fixture.providesAddressableAreas
    )?.providesAddressableAreas
    const slotName =
      cutoutAAs != null ? head(cutoutAAs[cutoutConfig.cutoutId]) ?? null : null

    if (slotName == null) {
      console.error(
        'Could not get correct slot location from deck definition and active deck config. Defaulting to A1.'
      )
    }
    const validSlotName: AddressableAreaName =
      slotName != null ? slotName : robotType === OT2_ROBOT_TYPE ? '1' : 'A1'

    return {
      location: validLocation,
      slotName: validSlotName,
    }
  }

  const filterAndMap = (
    fixtureIds: string | string[],
    validLocation: ValidDropTipBlowoutLocation
  ): DropTipBlowoutLocationDetails[] =>
    deckConfig
      .filter(config =>
        Array.isArray(fixtureIds)
          ? fixtureIds.includes(config.cutoutFixtureId)
          : fixtureIds === config.cutoutFixtureId
      )
      .map(config => createLocation(config, validLocation))

  const chooseDeckLocationOption: DropTipBlowoutLocationDetails = {
    location: 'deck',
    slotName: 'CHOOSE_DECK_LOCATION',
  }

  return [
    ...filterAndMap(TRASH_BIN_ADAPTER_FIXTURE, 'trash-bin'),
    ...filterAndMap(WASTE_CHUTE_FIXTURES, 'waste-chute'),
    chooseDeckLocationOption,
  ]
}
