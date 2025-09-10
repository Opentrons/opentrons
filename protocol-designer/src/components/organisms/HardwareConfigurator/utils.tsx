import { useState } from 'react'
import { useDispatch } from 'react-redux'

import {
  DEFAULT_AA_FOR_WASTE_CHUTE,
  FLEX_ROBOT_TYPE,
  getAAsToFixtureIdFromDeckDefWithFakes,
  getDeckDefFromRobotType,
  getMainAAForAFixture,
  getModuleModelFromAddressableArea,
  getNewConfigForDeckConfig,
  getReplacementFixtureForFixtureRemoval,
  MAGNETIC_BLOCK_V1,
  MODULE_FIXTURES_BY_MODEL,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
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
  CutoutFixtureId,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  CutoutIdToCutoutFixtureId,
  DeckConfiguration,
  DeckDefinition,
  ModuleModel,
} from '@opentrons/shared-data'
import type { FormModules } from '/protocol-designer/step-forms'
import type { Fixtures, WizardFormState } from '../types'
import type {
  CutoutConfigExtended,
  InitialDeckStateModules,
  OptionStage,
} from './AddFixtureModal'

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
    value: CutoutConfigExtended[],
    newDeckConfig?: DeckConfiguration
  ) => void
): DeckConfigurationEditingProps {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const dispatch = useDispatch()
  const [targetCutoutId, setTargetCutoutId] = useState<CutoutId | null>(null)
  const [
    addressableAreaId,
    setAddressableAreaId,
  ] = useState<AddressableAreaNamesWithFakes | null>(null)

  const [
    existingCutoutFixtureId,
    setExistingCutoutFixtureId,
  ] = useState<CutoutFixtureId | null>(null)

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

  const getCutoutFixtureType = (
    cutoutFixtureId: CutoutFixtureIdsWithFakes,
    addressableAreaId: AddressableAreaNamesWithFakes
  ): CutoutConfigExtended['type'] => {
    const thermocyclerCutoutFixtureId =
      cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE ||
      cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE
    const moduleModel = getModuleModelFromAddressableArea(
      addressableAreaId as AddressableAreaName
    )
    if (moduleModel != null) {
      return moduleModel
    } else if (cutoutFixtureId === 'trashBinAdapter') {
      return 'trashBin'
    } else if (thermocyclerCutoutFixtureId) {
      return 'thermocyclerModuleV2'
    } else if (
      WASTE_CHUTE_ADDRESSABLE_AREAS.includes(
        addressableAreaId as AddressableAreaName
      )
    ) {
      return 'wasteChute'
    } else {
      return 'stagingArea'
    }
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
    const type = getCutoutFixtureType(cutoutFixtureId, addressableAreaId)
    updateInitialDeckState?.(
      [
        {
          cutoutId,
          cutoutFixtureId: replacementFixtureId,
          addressableAreaId,
          type,
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
): CutoutConfigExtended[][] => {
  let availableOptions: CutoutConfigExtended[][] = []
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
          type: 'trashBin',
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
          type: 'stagingArea',
        },
      ],
    ]
  }

  return availableOptions
}

export const getWasteChuteOptions = (
  cutoutId: CutoutId
): CutoutConfigExtended[][] => {
  if (WASTE_CHUTE_CUTOUT === cutoutId) {
    return [
      [
        {
          cutoutId,
          cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          addressableAreaId: DEFAULT_AA_FOR_WASTE_CHUTE,
          type: 'wasteChute',
        },
      ],
      [
        {
          cutoutId,
          cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
          addressableAreaId: DEFAULT_AA_FOR_WASTE_CHUTE,
          type: 'wasteChute',
        },
      ],
    ]
  } else {
    return []
  }
}

const getFilteredModules = (
  moduleModel: ModuleModel,
  enableStackerFF: boolean
): ModuleModel[] =>
  Object.values(
    enableStackerFF ? FLEX_MODULE_MODELS_WITH_FF : FLEX_MODULE_MODELS
  ).filter(model => model === moduleModel)

const mapModuleToCutoutConfig = (
  model: ModuleModel,
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes,
  addressableAreasById: Record<string, unknown>
): CutoutConfigExtended[] | null => {
  const keys = Object.keys(addressableAreasById)
  const cutoutFixtureId = keys.find(key => key === model) as CutoutFixtureId

  if (!cutoutFixtureId) {
    return null
  }

  const aaforModule = getMainAAForAFixture(
    cutoutId,
    cutoutFixtureId,
    addressableAreaId
  )

  if (aaforModule === addressableAreaId) {
    return null
  }

  if (!aaforModule) {
    return null
  }

  return [
    {
      cutoutId,
      addressableAreaId: aaforModule,
      cutoutFixtureId,
      type: model,
    },
  ]
}

export const getThermocyclerFixtures = (
  cutoutId: CutoutId,
  enableStackerFF: boolean
): CutoutConfigExtended[][] => {
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
  return Object.values(moduleModel).map(model =>
    fixtureGroupKeys.map(cutout => ({
      cutoutId: cutout,
      addressableAreaId: THERMOCYCLER_MODULE_V2,
      cutoutFixtureId: fixtureGroupMatch[cutout] as CutoutFixtureId,
      type: model,
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
): CutoutConfigExtended[][] => {
  const addressableAreasById = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    deckDef
  )
  const filteredMods = getFilteredModules(moduleModel, enableStackerFF)
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

  return filteredMods
    .map(mod =>
      mapModuleToCutoutConfig(
        mod,
        cutoutId,
        addressableAreaId,
        addressableAreasById
      )
    )
    .filter((config): config is CutoutConfigExtended[] => config !== null)
}

export const getModules = (
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDef: DeckDefinition,
  enableStackerFF: boolean,
  fixtures: Fixtures
): CutoutConfigExtended[][] => {
  const availableOptions: CutoutConfigExtended[][] = []

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
): CutoutConfigExtended[][] => {
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
): CutoutConfigExtended[][] => {
  const {
    optionStage,
    cutoutId,
    existingCutoutFixtureId,
    addressableAreaId,
    deckDefinition,
    enableStackerFF,
    fixtures,
  } = props

  let availableOptions: CutoutConfigExtended[][] = []
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
