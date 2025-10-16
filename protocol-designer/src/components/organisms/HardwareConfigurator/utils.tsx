import { useState } from 'react'
import { useDispatch } from 'react-redux'

import {
  FLEX_ROBOT_TYPE,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  getAAsToFixtureIdFromDeckDefWithFakes,
  getDeckDefFromRobotType,
  getMainAAForAFixture,
  getModuleModelFromAddressableArea,
  getNewConfigForDeckConfig,
  getReplacementFixtureForFixtureRemoval,
  getWasteChuteOptions,
  MAGNETIC_BLOCK_V1,
  mapModuleToCutoutConfig,
  MODULE_FIXTURES_BY_MODEL,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'

import {
  FLEX_MODULE_MODELS,
  FLEX_MODULE_MODELS_WITH_FF,
} from '/protocol-designer/pages/Designer/DeckSetup/constants'
import { editDeckConfiguration } from '/protocol-designer/step-forms/actions'

import { AddFixtureModal } from './AddFixtureModal'

import type { ReactNode } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import type {
  AddressableAreaName,
  AddressableAreaNamesWithFakes,
  CutoutConfigMap,
  CutoutFixtureId,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  CutoutIdToCutoutFixtureId,
  DeckConfiguration,
  DeckDefinition,
  ModuleModel,
} from '@opentrons/shared-data'
import type { FormModules } from '/protocol-designer/step-forms'
import type { FixtureName, Fixtures, WizardFormState } from '../types'
import type { InitialDeckStateModules, OptionStage } from './AddFixtureModal'

interface DeckConfigurationEditingProps {
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
export function useDeckConfigurationEditing(
  deckConfig: DeckConfiguration,
  modules: FormModules | InitialDeckStateModules,
  fixtures: Fixtures,
  hasGripper: boolean,
  setValue?: UseFormSetValue<WizardFormState>,
  updateInitialDeckState?: (
    value: CutoutConfigMap[],
    newDeckConfig?: DeckConfiguration
  ) => void
): DeckConfigurationEditingProps {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const dispatch = useDispatch()
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

  //  removing fixture from changing configuration in the
  //  onboarding flow where state is stored using react-hook-form
  const removeFixtureFromCutoutForOnboarding = (
    cutoutId: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes,
    addressableAreaId: AddressableAreaNamesWithFakes
  ): void => {
    const replacementFixtureId = getReplacementFixtureForFixtureRemoval(
      cutoutFixtureId,
      cutoutId,
      addressableAreaId
    )

    const thermocyclerCutoutFixtureId =
      cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE ||
      cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE
    const tcCutouts = ['cutoutA1', 'cutoutB1']

    //  remove any fixtures from that cutoutId
    const filteredFixtures = Object.fromEntries(
      Object.entries(fixtures).filter(
        ([_, fixture]) => fixture.cutoutId !== cutoutId
      )
    )
    setValue?.('fixtures', filteredFixtures)

    //  remove any modules from that cutoutId
    const fixturedModules = Object.fromEntries(
      Object.entries(modules).filter(([_, module]) =>
        thermocyclerCutoutFixtureId
          ? !tcCutouts.includes((module.cutoutId as CutoutId) ?? 'cutoutA1')
          : module.cutoutId !== cutoutId
      )
    )
    setValue?.('modules', fixturedModules)

    const newDeckConfig = getNewConfigForDeckConfig(
      cutoutId,
      cutoutFixtureId,
      replacementFixtureId,
      deckConfig,
      deckDef,
      false
    )
    dispatch(editDeckConfiguration({ deckConfig: newDeckConfig }))
  }

  //  removing fixture from changing configuration in the
  //  edit hardware sections where state is stored using redux
  const removeFixtureFromCutoutForEditing = (
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
      false
    )
    updateInitialDeckState?.(
      [
        {
          cutoutId,
          cutoutFixtureId: replacementFixtureId,
          addressableAreaId,
        },
      ],
      newDeckConfig
    )
    dispatch(editDeckConfiguration({ deckConfig: newDeckConfig }))
  }

  return {
    addFixtureToCutout,
    removeFixtureFromCutout:
      setValue != null
        ? removeFixtureFromCutoutForOnboarding
        : removeFixtureFromCutoutForEditing,
    addFixtureModal:
      targetCutoutId != null && addressableAreaId != null ? (
        <AddFixtureModal
          cutoutId={targetCutoutId}
          closeModal={() => {
            setTargetCutoutId(null)
          }}
          addressableAreaId={addressableAreaId}
          fixtures={fixtures}
          modules={modules}
          deckConfig={deckConfig}
          setValue={setValue}
          hasGripper={hasGripper}
          updateInitialDeckState={updateInitialDeckState}
          existingCutoutFixtureId={existingCutoutFixtureId ?? undefined}
        />
      ) : null,
  }
}

export const getAllFixtureOptions = (
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes,
  fixtures: Fixtures,
  existingCutoutFixtureId?: CutoutFixtureIdsWithFakes
): CutoutConfigMap[][] => {
  let availableOptions: CutoutConfigMap[][] = []
  const stagingAreaInCutoutId = Object.values(fixtures).find(
    fixture => fixture.name === 'stagingArea' && fixture.cutoutId === cutoutId
  )
  const TrashBinAA = getMainAAForAFixture(
    cutoutId,
    TRASH_BIN_ADAPTER_FIXTURE,
    addressableAreaId,
    existingCutoutFixtureId
  )
  if (
    TrashBinAA != null &&
    !addressableAreaId.includes('fake') &&
    !stagingAreaInCutoutId
  ) {
    availableOptions = [
      ...availableOptions,
      [
        {
          cutoutId,
          cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
          addressableAreaId: TrashBinAA,
        },
      ],
    ]
  }

  const stagingAreaAA = getMainAAForAFixture(
    cutoutId,
    STAGING_AREA_RIGHT_SLOT_FIXTURE,
    addressableAreaId
  )

  if (stagingAreaAA != null && stagingAreaAA !== addressableAreaId) {
    availableOptions = [
      ...availableOptions,
      [
        {
          cutoutId,
          cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
          addressableAreaId: stagingAreaAA,
        },
      ],
    ]
  }

  return availableOptions
}

const getFilteredModules = (
  moduleModel: ModuleModel,
  enableStackerFF: boolean
): ModuleModel[] =>
  Object.values(
    enableStackerFF ? FLEX_MODULE_MODELS_WITH_FF : FLEX_MODULE_MODELS
  ).filter(model => model === moduleModel)

export const getThermocyclerFixtures = (
  cutoutId: CutoutId,
  enableStackerFF: boolean
): CutoutConfigMap[][] => {
  const fixtureIds = MODULE_FIXTURES_BY_MODEL[THERMOCYCLER_MODULE_V2]
  if (!fixtureIds || fixtureIds.length === 0) return []

  const deckDef = getDeckDefFromRobotType('OT-3 Standard')

  // Filter deck fixtures that match this cutout and are Thermocycler fixtures
  const matchingFixtures = deckDef.cutoutFixtures.filter(
    fixture =>
      fixture.mayMountTo.includes(cutoutId) &&
      fixtureIds.includes(fixture.id as CutoutFixtureId)
  )

  // Get fixture group mapping for this cutout
  const fixtureGroups = matchingFixtures.map(
    f => f.fixtureGroup[cutoutId] ?? []
  )
  const firstValidGroup = fixtureGroups.find(group => group.length > 0)

  if (!firstValidGroup) return []

  const fixtureGroupMatch = firstValidGroup[0] as CutoutIdToCutoutFixtureId
  const fixtureGroupKeys = Object.keys(fixtureGroupMatch) as CutoutId[]
  const moduleModel = getFilteredModules(
    THERMOCYCLER_MODULE_V2,
    enableStackerFF
  )
  return Object.values(moduleModel).map(_ =>
    fixtureGroupKeys.map(cutout => ({
      cutoutId: cutout,
      addressableAreaId: THERMOCYCLER_MODULE_V2,
      cutoutFixtureId: fixtureGroupMatch[cutout] as CutoutFixtureId,
    }))
  )
}

export const getModuleFixtures = (
  cutoutId: CutoutId,
  moduleModel: ModuleModel,
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDef: DeckDefinition,
  enableStackerFF: boolean,
  fixtures: Fixtures
): CutoutConfigMap[][] => {
  const addressableAreasById = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    deckDef
  )
  const filteredModuleModels = getFilteredModules(moduleModel, enableStackerFF)
  const isStagingAreaInSlot4 =
    fixtures != null &&
    Object.values(fixtures).some(
      fixture => fixture.cutoutId === cutoutId && fixture.name === 'stagingArea'
    )

  if (isStagingAreaInSlot4) {
    const config = mapModuleToCutoutConfig(
      'magneticBlockV1',
      cutoutId,
      addressableAreaId,
      addressableAreasById
    )
    return config ? [config] : []
  }

  return filteredModuleModels
    .map(moduleModel =>
      mapModuleToCutoutConfig(
        moduleModel,
        cutoutId,
        addressableAreaId,
        addressableAreasById
      )
    )
    .filter((config): config is CutoutConfigMap[] => config !== null)
}

export const getModules = (
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDef: DeckDefinition,
  enableStackerFF: boolean,
  fixtures: Fixtures
): CutoutConfigMap[][] => {
  const availableOptions: CutoutConfigMap[][] = []

  if (THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId)) {
    availableOptions.push(...getThermocyclerFixtures(cutoutId, enableStackerFF))
  }

  // staging area special case where only magnetic block can go on it
  const isStagingAreaInSlot4 =
    fixtures != null &&
    Object.values(fixtures).some(
      fixture => fixture.cutoutId === cutoutId && fixture.name === 'stagingArea'
    )

  if (isStagingAreaInSlot4) {
    return getModuleFixtures(
      cutoutId,
      MAGNETIC_BLOCK_V1,
      addressableAreaId,
      deckDef,
      enableStackerFF,
      fixtures
    )
  }

  // otherwise, normal loop of rest of modules that can go on slot
  Object.entries(MODULE_FIXTURES_BY_MODEL).forEach(([model, _]) => {
    if (model === THERMOCYCLER_MODULE_V2) return

    const moduleOptions = getModuleFixtures(
      cutoutId,
      model as ModuleModel,
      addressableAreaId,
      deckDef,
      enableStackerFF,
      fixtures
    )
    availableOptions.push(...moduleOptions)
  })

  return availableOptions
}

export const getModuleOptions = (
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDef: DeckDefinition,
  enableStackerFF: boolean,
  fixtures: Fixtures
): CutoutConfigMap[][] => {
  return getModules(
    cutoutId,
    addressableAreaId,
    deckDef,
    enableStackerFF,
    fixtures
  )
}

interface AvailableOptionsProps {
  optionStage: OptionStage
  cutoutId: CutoutId
  deckDefinition: DeckDefinition
  addressableAreaId: AddressableAreaNamesWithFakes
  enableStackerFF: boolean
  fixtures: Fixtures
  existingCutoutFixtureId?: CutoutFixtureIdsWithFakes
}
export const getAvailableOptions = (
  props: AvailableOptionsProps
): CutoutConfigMap[][] => {
  const {
    optionStage,
    cutoutId,
    existingCutoutFixtureId,
    addressableAreaId,
    deckDefinition,
    enableStackerFF,
    fixtures,
  } = props

  let availableOptions: CutoutConfigMap[][] = []
  if (optionStage === 'fixtureOptions') {
    availableOptions = getAllFixtureOptions(
      cutoutId,
      addressableAreaId,
      fixtures,
      existingCutoutFixtureId
    )
  }
  if (optionStage === 'moduleOptions') {
    availableOptions = getModuleOptions(
      cutoutId,
      addressableAreaId,
      deckDefinition,
      enableStackerFF,
      fixtures
    )
  }
  if (optionStage === 'wasteChuteOptions') {
    availableOptions = getWasteChuteOptions(cutoutId)
  }
  return availableOptions
}

export const getFixtureNameFromAddresableArea = (
  addressableArea: AddressableAreaName
): FixtureName | null => {
  let fixtureName: FixtureName | null = null
  if (WASTE_CHUTE_ADDRESSABLE_AREAS.includes(addressableArea)) {
    fixtureName = 'wasteChute'
  } else if (MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(addressableArea)) {
    fixtureName = 'trashBin'
  } else if (
    FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS.includes(addressableArea)
  ) {
    fixtureName = 'stagingArea'
  }

  return fixtureName
}

export const getModuleModel = (
  addressableAreaId: AddressableAreaNamesWithFakes
): ModuleModel | null => {
  if (addressableAreaId === 'thermocyclerModuleV2') {
    return THERMOCYCLER_MODULE_V2
  } else {
    return getModuleModelFromAddressableArea(
      addressableAreaId as AddressableAreaName
    )
  }
}
