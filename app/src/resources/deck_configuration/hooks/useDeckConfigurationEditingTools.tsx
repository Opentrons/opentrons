import { useState } from 'react'

import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_CUTOUTS,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'

// TODO: return the arguments or something - don't instantiate ui in helper code like this
/* eslint-disable-next-line opentrons/no-imports-across-applications */
import { AddFixtureModal } from '/app/organisms/DeviceDetailsDeckConfiguration/AddFixtureModal'

import { useNotifyDeckConfigurationQuery } from '../useNotifyDeckConfigurationQuery'

import type { ReactNode } from 'react'
import type { CutoutFixtureId, CutoutId } from '@opentrons/shared-data'

const DECK_CONFIG_REFETCH_INTERVAL = 5000

interface DeckConfigurationEditingTools {
  addFixtureToCutout: (cutoutId: CutoutId) => void
  removeFixtureFromCutout: (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ) => void
  addFixtureModal: ReactNode
}
export function useDeckConfigurationEditingTools(
  isOnDevice: boolean
): DeckConfigurationEditingTools {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const deckConfig =
    useNotifyDeckConfigurationQuery({
      refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
    }).data ?? []
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const [targetCutoutId, setTargetCutoutId] = useState<CutoutId | null>(null)

  const addFixtureToCutout = (cutoutId: CutoutId): void => {
    setTargetCutoutId(cutoutId)
  }

  const removeFixtureFromCutout = (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ): void => {
    let replacementFixtureId: CutoutFixtureId = SINGLE_CENTER_SLOT_FIXTURE
    if (SINGLE_RIGHT_CUTOUTS.includes(cutoutId)) {
      replacementFixtureId = SINGLE_RIGHT_SLOT_FIXTURE
    } else if (SINGLE_LEFT_CUTOUTS.includes(cutoutId)) {
      replacementFixtureId = SINGLE_LEFT_SLOT_FIXTURE
    }

    const fixtureGroup =
      deckDef.cutoutFixtures.find(cf => cf.id === cutoutFixtureId)
        ?.fixtureGroup ?? {}

    let newDeckConfig = deckConfig
    if (cutoutId in fixtureGroup) {
      const groupMap =
        fixtureGroup[cutoutId]?.find(group =>
          Object.entries(group).every(([cId, cfId]) =>
            deckConfig.find(
              config =>
                config.cutoutId === cId && config.cutoutFixtureId === cfId
            )
          )
        ) ?? {}
      newDeckConfig = deckConfig.map(cutoutConfig =>
        cutoutConfig.cutoutId in groupMap
          ? {
              ...cutoutConfig,
              cutoutFixtureId: replacementFixtureId,
              opentronsModuleSerialNumber: undefined,
            }
          : cutoutConfig
      )
    } else {
      newDeckConfig = deckConfig.map(cutoutConfig =>
        cutoutConfig.cutoutId === cutoutId
          ? {
              ...cutoutConfig,
              cutoutFixtureId: replacementFixtureId,
              opentronsModuleSerialNumber: undefined,
            }
          : cutoutConfig
      )
    }
    updateDeckConfiguration(newDeckConfig)
  }

  return {
    addFixtureToCutout,
    removeFixtureFromCutout,
    addFixtureModal:
      targetCutoutId != null ? (
        <AddFixtureModal
          cutoutId={targetCutoutId}
          closeModal={() => {
            setTargetCutoutId(null)
          }}
          isOnDevice={isOnDevice}
        />
      ) : null,
  }
}
