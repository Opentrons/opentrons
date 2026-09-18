import { useState } from 'react'

import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getNewConfigForDeckConfig,
  getReplacementFixtureForFixtureRemoval,
} from '@opentrons/shared-data'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
// TODO: return the arguments or something - don't instantiate ui in helper code like this
/* eslint-disable-next-line opentrons/no-imports-across-applications */
import { AddFixtureModal } from '/app/organisms/DeviceDetailsDeckConfiguration/AddFixtureModal'

import { useNotifyDeckConfigurationQuery } from '../useNotifyDeckConfigurationQuery'

import type { ReactNode } from 'react'
import type {
  AddressableAreaNamesWithFakes,
  CutoutFixtureId,
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
    cutoutFixtureId: CutoutFixtureIdsWithFakes,
    addressableAreaId: AddressableAreaNamesWithFakes
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
  const documentationState = useDocumentationState()
  const { updateDeckConfiguration } =
    useUpdateDeckConfigurationMutation(documentationState)
  const [targetCutoutId, setTargetCutoutId] = useState<CutoutId | null>(null)
  const [addressableAreaId, setAddressableAreaId] =
    useState<AddressableAreaNamesWithFakes | null>(null)

  const [existingCutoutFixtureId, setExistingCutoutFixtureId] =
    useState<CutoutFixtureId | null>(null)

  const addFixtureToCutout = (
    cutoutId: CutoutId,
    addressableAreaId: AddressableAreaNamesWithFakes
  ): void => {
    setTargetCutoutId(cutoutId)
    setAddressableAreaId(addressableAreaId)
    const foundFixtureId =
      deckConfig.find(config => config.cutoutId === cutoutId)
        ?.cutoutFixtureId ?? null
    setExistingCutoutFixtureId(foundFixtureId ?? null)
  }

  const removeFixtureFromCutout = (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes,
    addressableAreaId: AddressableAreaNamesWithFakes
  ): void => {
    const replacementFixtureId = getReplacementFixtureForFixtureRemoval(
      cutoutFixtureId,
      cutoutId,
      addressableAreaId
    )
    const newDeckConfig = getNewConfigForDeckConfig(
      cutoutId,
      cutoutFixtureId,
      replacementFixtureId,
      deckConfig,
      deckDef,
      true
    )

    updateDeckConfiguration(newDeckConfig)
  }

  return {
    addFixtureToCutout,
    removeFixtureFromCutout,
    addFixtureModal:
      targetCutoutId != null && addressableAreaId != null ? (
        <AddFixtureModal
          updateDeckConfiguration={updateDeckConfiguration}
          cutoutId={targetCutoutId}
          addressableAreaId={addressableAreaId}
          closeModal={() => {
            setTargetCutoutId(null)
          }}
          isOnDevice={isOnDevice}
          deckDef={deckDef}
          existingCutoutFixtureId={existingCutoutFixtureId ?? undefined}
        />
      ) : null,
  }
}
