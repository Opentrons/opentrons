import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  FLEX_ROBOT_TYPE,
  getAddedMissingThermocyclerFixtures,
  getCutoutFixtureIdsForModuleModel,
  getCutoutIdFromAddressableArea,
  getDeckDefFromRobotType,
  getEmptyDeckConfiguration,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { editDeckConfiguration } from '/protocol-designer/step-forms/actions'
import { getDeckConfiguration } from '/protocol-designer/step-forms/selectors'

import { HardwareConfiguratorContainer } from './HardwareConfiguratorContainer'
import { mergeToComboFixtures } from './utils'

import type { UseFormSetValue } from 'react-hook-form'
import type {
  AddressableAreaNamesWithFakes,
  CutoutConfig,
  CutoutConfigMap,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { FormModule, FormModules } from '/protocol-designer/step-forms'
import type { Fixtures, WizardFormState } from '../types'
import type { InitialDeckStateModules, ModuleExtended } from './AddFixtureModal'

interface HardwareConfiguratorProps {
  modules: FormModules | InitialDeckStateModules
  hasGripper: boolean
  fixtures: Fixtures
  setValue?: UseFormSetValue<WizardFormState>
  updateInitialDeckState?: (
    value: CutoutConfigMap[],
    newDeckConfig?: DeckConfiguration
  ) => void
}
export function HardwareConfigurator(
  props: HardwareConfiguratorProps
): JSX.Element {
  const { modules, setValue, hasGripper, fixtures, updateInitialDeckState } =
    props
  const dispatch = useDispatch()
  const { deckConfig } = useSelector(getDeckConfiguration)
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const emptyDeckConfiguration = getEmptyDeckConfiguration(deckDef)

  const deckConfigWithAA =
    replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(
      emptyDeckConfiguration
    )
  const simpleDeckConfig: DeckConfiguration = emptyDeckConfiguration.filter(
    ({ cutoutId }) => {
      const hasModule = Object.values(modules).some(
        module =>
          getCutoutIdFromAddressableArea(module.slot as string, deckDef) ===
          cutoutId
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

  const moduleConfig: CutoutConfigMap[] = Object.values(modules).flatMap(
    (module: FormModule | ModuleExtended): CutoutConfigMap[] => {
      const fixtureModule = getCutoutFixtureIdsForModuleModel(module.model)[0]
      const cutoutId = getCutoutIdFromAddressableArea(module.slot, deckDef)!
      const matchingDeckConfigEntry = deckConfigWithAA.find(
        config =>
          config.cutoutId === cutoutId &&
          config.cutoutFixtureId === fixtureModule
      )
      const defaultModuleConfig: CutoutConfigMap = {
        cutoutId,
        cutoutFixtureId: fixtureModule,
        addressableAreaId:
          matchingDeckConfigEntry?.addressableAreaId ??
          (module.slot as AddressableAreaNamesWithFakes),
      }
      // getAddedMissingThermocyclerFixtures returns input array + any missing TC fixtures
      return getAddedMissingThermocyclerFixtures([defaultModuleConfig], deckDef)
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

  // Merge modules and fixtures into combo fixtures where applicable
  const {
    comboFixtures,
    remainingModuleConfig,
    remainingAdditionalEquipmentConfig,
  } = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

  const updatedDeckConfig = [
    ...simpleDeckConfig,
    ...remainingModuleConfig,
    ...remainingAdditionalEquipmentConfig,
    ...comboFixtures,
  ]

  //  initiate deck config
  useEffect(
    () => {
      dispatch(
        editDeckConfiguration({
          deckConfig: updatedDeckConfig as DeckConfiguration,
        })
      )
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
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
