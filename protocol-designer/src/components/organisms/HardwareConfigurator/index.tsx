import { useState } from 'react'
import { DeckConfigurator } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_SIMPLEST_DECK_CONFIG,
  getCutoutIdFromAddressableArea,
  getDeckDefFromRobotType,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { useDeckConfigurationEditing } from './useDeckConfigurationEditing'
import type {
  CutoutConfig,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { FormModules } from '../../../step-forms'
import type { Fixtures, WizardFormState } from '../types'
import type { UseFormSetValue } from 'react-hook-form'
import type { CutoutConfigExtended, ModuleMore } from './AddFixtureModal'

interface HardwareConfiguratorProps {
  modules:
    | FormModules
    | {
        [x: string]: ModuleMore
      }
  hasGripper: boolean
  fixtures: Fixtures
  setValue?: UseFormSetValue<WizardFormState>
  updateInitialDeckState?: (value: CutoutConfigExtended[]) => void
}
export function HardwareConfigurator(
  props: HardwareConfiguratorProps
): JSX.Element {
  const {
    modules,
    setValue,
    hasGripper,
    fixtures,
    updateInitialDeckState,
  } = props

  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const simpleDeckConfig: DeckConfiguration = FLEX_SIMPLEST_DECK_CONFIG.filter(
    ({ cutoutId }) => {
      const hasModule = Object.values(modules).some(
        module => module.cutoutId === cutoutId
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
          module.slot as string,
          deckDef
        ) as CutoutId,
        cutoutFixtureId: hasThermocycler
          ? 'thermocyclerModuleV2Front'
          : module.cutoutFixtureId ?? 'singleStandardSlot',
      }
      const thermocyclerA1Config: CutoutConfig = {
        cutoutId: 'cutoutA1',
        cutoutFixtureId: 'thermocyclerModuleV2Rear',
      }
      return [
        defaultModuleConfig,
        ...(hasThermocycler ? [thermocyclerA1Config] : []),
      ]
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
    modules,
    fixtures,
    hasGripper,
    setValue,
    updateInitialDeckState
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
