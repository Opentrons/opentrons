import { useState } from 'react'

import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  AddressableArea,
  AddressableAreaNamesWithFakes,
  AddressableAreaWithFakes,
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getReplacementFixtureForFixtureRemoval,
} from '@opentrons/shared-data'

// TODO: return the arguments or something - don't instantiate ui in helper code like this
/* eslint-disable-next-line opentrons/no-imports-across-applications */
import { AddFixtureModal } from '/app/organisms/DeviceDetailsDeckConfiguration/AddFixtureModal'

import { useNotifyDeckConfigurationQuery } from '../useNotifyDeckConfigurationQuery'

import type { ReactNode } from 'react'
import type {
  CutoutFixtureIdsWithFakes,
  CutoutId,
} from '@opentrons/shared-data'

const DECK_CONFIG_REFETCH_INTERVAL = 5000

interface DeckConfigurationEditingTools {
  addFixtureToCutout: (
    cutoutId: CutoutId,
    addressableAreaId: AddressableAreaNamesWithFakes
  ) => void
  removeFixtureFromCutout: (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes
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
  const [
    addressableAreaId,
    setAddressableAreaId,
  ] = useState<AddressableAreaNamesWithFakes | null>(null)

  const addFixtureToCutout = (
    cutoutId: CutoutId,
    addressableAreaId: AddressableAreaNamesWithFakes
  ): void => {
    setTargetCutoutId(cutoutId)
    setAddressableAreaId(addressableAreaId)
  }

  const removeFixtureFromCutout = (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes
  ): void => {
    const replacementFixtureId = getReplacementFixtureForFixtureRemoval(
      cutoutFixtureId,
      cutoutId
    )
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
      targetCutoutId != null && addressableAreaId != null ? (
        <AddFixtureModal
          cutoutId={targetCutoutId}
          addressableAreaId={addressableAreaId}
          closeModal={() => {
            setTargetCutoutId(null)
          }}
          isOnDevice={isOnDevice}
        />
      ) : null,
  }
}
