import { useMemo } from 'react'

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

import { mergeToComboFixtures } from '../utils'

import type {
  AddressableAreaNamesWithFakes,
  CutoutConfig,
  CutoutConfigMap,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { FormModule, FormModules } from '/protocol-designer/step-forms'
import type { Fixtures } from '../../types'
import type {
  InitialDeckStateModules,
  ModuleExtended,
} from '../AddFixtureModal'

export function useMemoizedUpdatedDeckConfig(
  modules: FormModules | InitialDeckStateModules,
  fixtures: Fixtures
): DeckConfiguration {
  return useMemo((): DeckConfiguration => {
    const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
    const emptyDeckConfiguration = getEmptyDeckConfiguration(deckDef)
    const deckConfigWithAA =
      replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(
        emptyDeckConfiguration
      )
    const modulesValues = Object.values(modules)
    const fixturesValues = Object.values(fixtures)
    const simpleDeckConfig: DeckConfiguration = emptyDeckConfiguration.filter(
      ({ cutoutId }) => {
        const hasModule = modulesValues.some(
          module =>
            getCutoutIdFromAddressableArea(module.slot as string, deckDef) ===
            cutoutId
        )
        //  since we are adding cutoutA1 in moduleConfig if
        //  there is a TC
        const hasTCAndCutoutA1 =
          modulesValues.some(
            module => module.type === THERMOCYCLER_MODULE_TYPE
          ) && cutoutId === 'cutoutA1'
        const hasFixture = fixturesValues.some(
          fixture => fixture.cutoutId === cutoutId
        )
        return !hasModule && !hasFixture && !hasTCAndCutoutA1
      }
    )

    const moduleConfig: CutoutConfigMap[] = modulesValues.flatMap(
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
        return getAddedMissingThermocyclerFixtures(
          [defaultModuleConfig],
          deckDef
        )
      }
    )
    const additionalEquipmentConfig: DeckConfiguration =
      fixturesValues.map<CutoutConfig>(fixtureItem => ({
        cutoutId: fixtureItem.cutoutId as CutoutId,
        cutoutFixtureId: fixtureItem.cutoutFixtureId,
      }))

    // Merge modules and fixtures into combo fixtures where applicable
    const {
      comboFixtures,
      remainingModuleConfig,
      remainingAdditionalEquipmentConfig,
    } = mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

    return [
      ...simpleDeckConfig,
      ...remainingModuleConfig,
      ...remainingAdditionalEquipmentConfig,
      ...comboFixtures,
    ] as DeckConfiguration
  }, [modules, fixtures])
}
