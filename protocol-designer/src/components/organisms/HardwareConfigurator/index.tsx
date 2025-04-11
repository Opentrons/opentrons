import { useState } from 'react'
import { DeckConfigurator } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getCutoutIdFromAddressableArea,
  getDeckDefFromRobotType,
  FLEX_SIMPLEST_DECK_CONFIG,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { useDeckConfigurationEditing } from './util'
import type {
  CutoutConfig,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { WizardTileProps } from '../../../pages/Onboarding/types'

export function HardwareConfigurator(props: WizardTileProps): JSX.Element {
  const { watch, setValue } = props
  const fixtures = watch('fixtures')
  const modules = watch('modules')
  const hasGripper = watch('hasGripper')

  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const simpleDeckConfig: DeckConfiguration = FLEX_SIMPLEST_DECK_CONFIG.filter(
    deckConfig => {
      const cutoutId = deckConfig.cutoutId
      const hasModule = Object.values(modules).some(
        module =>
          getCutoutIdFromAddressableArea(module.slot, deckDef) === cutoutId
      )

      const hasFixture = Object.values(fixtures).some(
        fixture => fixture.cutoutId === cutoutId
      )
      return !hasModule && !hasFixture
    }
  )

  const moduleConfig: DeckConfiguration = Object.values(modules).flatMap(
    (module): DeckConfiguration => {
      const hasThermocycler = module.type === THERMOCYCLER_MODULE_TYPE
      const defaultModuleConfig: CutoutConfig = {
        cutoutId: getCutoutIdFromAddressableArea(
          module.slot,
          deckDef
        ) as CutoutId,
        cutoutFixtureId: module.cutoutFixtureId ?? 'singleStandardSlot',
      }
      const thermocyclerA1Config: CutoutConfig = {
        cutoutId: 'cutoutA1',
        cutoutFixtureId: 'thermocyclerModuleV2Rear',
      }
      return hasThermocycler
        ? [defaultModuleConfig, thermocyclerA1Config]
        : [defaultModuleConfig]
    }
  )
  const additionalEquipmentConfig: DeckConfiguration = Object.values(
    fixtures
  ).map(
    (ae): CutoutConfig => ({
      cutoutId: ae.cutoutId as CutoutId,
      cutoutFixtureId: ae.cutoutFixtureId,
    })
  )
  const deckConfig: DeckConfiguration = [
    ...simpleDeckConfig,
    ...moduleConfig,
    ...additionalEquipmentConfig,
  ]
  const [updatedDeckConfig, setUpdatedDeckConfig] = useState<DeckConfiguration>(
    deckConfig
  )
  const {
    addFixtureModal,
    addFixtureToCutout,
    removeFixtureFromCutout,
  } = useDeckConfigurationEditing(
    updatedDeckConfig,
    setUpdatedDeckConfig,
    setValue,
    modules,
    fixtures,
    hasGripper
  )

  return (
    <>
      {addFixtureModal}
      <DeckConfigurator
        editableCutoutIds={updatedDeckConfig.map(({ cutoutId }) => cutoutId)}
        deckConfig={updatedDeckConfig}
        handleClickAdd={addFixtureToCutout}
        handleClickRemove={removeFixtureFromCutout}
      />
    </>
  )
}
