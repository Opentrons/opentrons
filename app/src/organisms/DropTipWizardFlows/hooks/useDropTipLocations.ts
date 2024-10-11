import { useMemo } from 'react'

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
  const { data: deckConfig = [] } = useNotifyDeckConfigurationQuery()
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])

  return useMemo(() => {
    const createLocation = (
      cutoutConfig: CutoutConfig,
      validLocation: ValidDropTipBlowoutLocation
    ): DropTipBlowoutLocationDetails => {
      const cutoutAAs = deckDef.cutoutFixtures.find(
        fixture => cutoutConfig.cutoutId in fixture.providesAddressableAreas
      )?.providesAddressableAreas
      const slotName =
        cutoutAAs?.[cutoutConfig.cutoutId]?.[0] ??
        (robotType === OT2_ROBOT_TYPE ? '1' : 'A1')

      if (!cutoutAAs?.[cutoutConfig.cutoutId]?.[0]) {
        console.error(
          'Could not get correct slot location from deck definition and active deck config. Defaulting to A1.'
        )
      }

      return {
        location: validLocation,
        slotName,
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

    return robotType === OT2_ROBOT_TYPE
      ? [FIXED_TRASH_LOCATION, CHOOSE_DECK_LOCATION]
      : [
          ...filterAndMap(TRASH_BIN_ADAPTER_FIXTURE, 'trash-bin'),
          ...filterAndMap(WASTE_CHUTE_FIXTURES, 'waste-chute'),
          CHOOSE_DECK_LOCATION,
        ]
  }, [deckConfig, deckDef, robotType])
}

const FIXED_TRASH_LOCATION: DropTipBlowoutLocationDetails = {
  location: 'fixed-trash',
  slotName: 'fixedTrash',
}

const CHOOSE_DECK_LOCATION: DropTipBlowoutLocationDetails = {
  location: 'deck',
  slotName: 'CHOOSE_DECK_LOCATION',
}
