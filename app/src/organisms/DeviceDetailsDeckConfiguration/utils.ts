import {
  getAAsToFixtureIdFromDeckDefWithFakes,
  getDeckDefFromRobotType,
  getMainAAForAFixture,
  getWasteChuteOptions,
  MAGNETIC_BLOCK_V1_FIXTURE,
  mapModuleToCutoutConfig,
  MODULE_FIXTURES_BY_MODEL,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  TRASH_BIN_ADAPTER_FIXTURE,
} from '@opentrons/shared-data'

import type { AttachedModule } from '@opentrons/api-client'
import type {
  AddressableAreaNamesWithFakes,
  CutoutConfigMap,
  CutoutFixtureId,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  CutoutIdToCutoutFixtureId,
  DeckDefinition,
  ModuleModel,
} from '@opentrons/shared-data'

const getFilteredModules = (
  unconfiguredMods: AttachedModule[],
  moduleModel: ModuleModel
): AttachedModule[] =>
  unconfiguredMods.filter(mod => mod.moduleModel === moduleModel)

export const getModuleUnconfiguredFixtures = (
  unconfiguredMods: AttachedModule[],
  cutoutId: CutoutId,
  moduleModel: ModuleModel,
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDef: DeckDefinition
): CutoutConfigMap[][] => {
  const addressableAreasById = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    deckDef
  )
  const filteredMods = getFilteredModules(unconfiguredMods, moduleModel)

  return filteredMods
    .map(mod =>
      mapModuleToCutoutConfig(
        mod.moduleModel,
        cutoutId,
        addressableAreaId,
        addressableAreasById,
        mod.serialNumber
      )
    )
    .filter((config): config is CutoutConfigMap[] => config !== null)
}

export const getThermoUnconfiguredFixtures = (
  unconfiguredMods: AttachedModule[],
  cutoutId: CutoutId
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

  return getFilteredModules(unconfiguredMods, THERMOCYCLER_MODULE_V2).map(mod =>
    fixtureGroupKeys.map(cutout => ({
      cutoutId: cutout,
      addressableAreaId: THERMOCYCLER_MODULE_V2,
      cutoutFixtureId: fixtureGroupMatch[cutout] as CutoutFixtureId,
      opentronsModuleSerialNumber: mod.serialNumber,
    }))
  )
}

export const getUnconfiguredMods = (
  cutoutId: CutoutId,
  unconfiguredMods: AttachedModule[],
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDef: DeckDefinition
): CutoutConfigMap[][] => {
  const availableOptions: CutoutConfigMap[][] = []

  if (THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId)) {
    availableOptions.push(
      ...getThermoUnconfiguredFixtures(unconfiguredMods, cutoutId)
    )
  }

  // Loop over all module models in the fixture mapping (excluding Thermocycler)
  Object.entries(MODULE_FIXTURES_BY_MODEL).forEach(([model, _]) => {
    if (model === THERMOCYCLER_MODULE_V2) return

    const moduleOptions = getModuleUnconfiguredFixtures(
      unconfiguredMods,
      cutoutId,
      model as ModuleModel,
      addressableAreaId,
      deckDef
    )

    availableOptions.push(...moduleOptions)
  })

  return availableOptions
}

export const getModuleOptions = (
  cutoutId: CutoutId,
  unconfiguredMods: AttachedModule[],
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDef: DeckDefinition
): CutoutConfigMap[][] => {
  let availableOptions: CutoutConfigMap[][] = []
  const aaMagBlockId = getMainAAForAFixture(
    cutoutId,
    MAGNETIC_BLOCK_V1_FIXTURE,
    addressableAreaId
  )
  if (aaMagBlockId != null) {
    availableOptions.push([
      {
        cutoutId,
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
        addressableAreaId: aaMagBlockId,
      },
    ])
  }
  if (unconfiguredMods.length > 0) {
    availableOptions = [
      ...availableOptions,
      ...getUnconfiguredMods(
        cutoutId,
        unconfiguredMods,
        addressableAreaId,
        deckDef
      ),
    ]
  }
  return availableOptions
}

export const getFixtureOptions = (
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes,
  existingCutoutFixtureId?: CutoutFixtureIdsWithFakes
): CutoutConfigMap[][] => {
  let availableOptions: CutoutConfigMap[][] = []
  const TrashBinAA = getMainAAForAFixture(
    cutoutId,
    TRASH_BIN_ADAPTER_FIXTURE,
    addressableAreaId,
    existingCutoutFixtureId
  )

  if (TrashBinAA != null) {
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

export const getOptions = (
  cutoutId: CutoutId,
  unconfiguredMods: AttachedModule[],
  optionStage: string,
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDefinition: DeckDefinition,
  existingCutoutFixtureId?: CutoutFixtureIdsWithFakes
): CutoutConfigMap[][] => {
  if (optionStage === 'fixtureOptions') {
    return getFixtureOptions(
      cutoutId,
      addressableAreaId,
      existingCutoutFixtureId
    )
  }
  if (optionStage === 'moduleOptions') {
    return getModuleOptions(
      cutoutId,
      unconfiguredMods,
      addressableAreaId,
      deckDefinition
    )
  }
  if (optionStage === 'wasteChuteOptions') {
    return getWasteChuteOptions(cutoutId)
  }
  return []
}
