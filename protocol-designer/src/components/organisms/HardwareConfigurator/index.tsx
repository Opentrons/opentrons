import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  FLEX_ROBOT_TYPE,
  FLEX_SIMPLEST_DECK_CONFIG,
  getCutoutIdFromAddressableArea,
  getDeckDefFromRobotType,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
} from '@opentrons/shared-data'

import { editDeckConfiguration } from '../../../step-forms/actions'
import { getDeckConfiguration } from '../../../step-forms/selectors'
import { HardwareConfiguratorContainer } from './HardwareConfiguratorContainer'

import type { UseFormSetValue } from 'react-hook-form'
import type {
  CutoutConfig,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { FormModule, FormModules } from '../../../step-forms'
import type { Fixtures, WizardFormState } from '../types'
import type {
  CutoutConfigExtended,
  InitialDeckStateModules,
  ModuleExtended,
} from './AddFixtureModal'

interface HardwareConfiguratorProps {
  modules: FormModules | InitialDeckStateModules
  hasGripper: boolean
  fixtures: Fixtures
  setValue?: UseFormSetValue<WizardFormState>
  updateInitialDeckState?: (
    value: CutoutConfigExtended[],
    newDeckConfig?: DeckConfiguration
  ) => void
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
  const dispatch = useDispatch()
  const { deckConfig } = useSelector(getDeckConfiguration)
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const simpleDeckConfig: DeckConfiguration = FLEX_SIMPLEST_DECK_CONFIG.filter(
    ({ cutoutId }) => {
      const hasModule = Object.values(modules).some(
        module => module.cutoutId === cutoutId
      )
      //  since we are adding cutoutA1 in moduleConfig if
      //  there is a TC
      const hasTCAndCutoutA1 =
        Object.values(modules).some(
          module => module.type === THERMOCYCLER_MODULE_TYPE
        ) && cutoutId === 'cutoutA1'
      const hasFixture = Object.values(fixtures).some(
        fixture => fixture.cutoutId === cutoutId
      )
      return !hasModule && !hasFixture && !hasTCAndCutoutA1
    }
  )
  const moduleConfig: DeckConfiguration = Object.values(modules).flatMap(
    (module: FormModule | ModuleExtended): DeckConfiguration => {
      const hasThermocycler = module.type === THERMOCYCLER_MODULE_TYPE
      const defaultModuleConfig: CutoutConfig = {
        cutoutId: getCutoutIdFromAddressableArea(
          module.slot,
          deckDef
        ) as CutoutId,
        cutoutFixtureId: hasThermocycler
          ? THERMOCYCLER_V2_FRONT_FIXTURE
          : 'cutoutFixtureId' in module
          ? module.cutoutFixtureId ?? 'singleStandardSlot'
          : 'singleStandardSlot',
      }
      const thermocyclerA1Config: CutoutConfig = {
        cutoutId: 'cutoutA1',
        cutoutFixtureId: THERMOCYCLER_V2_REAR_FIXTURE,
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

  //  initiate deck config
  useEffect(() => {
    dispatch(
      editDeckConfiguration({
        deckConfig: [
          ...simpleDeckConfig,
          ...moduleConfig,
          ...additionalEquipmentConfig,
        ],
      })
    )
  }, [])
  return (
    <HardwareConfiguratorContainer
      modules={modules}
      hasGripper={hasGripper ?? false}
      fixtures={fixtures}
      deckConfig={deckConfig}
      setValue={setValue}
      updateInitialDeckState={updateInitialDeckState}
    />
  )
}
