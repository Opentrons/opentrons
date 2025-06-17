import {
  DEFAULT_AA_FOR_WASTE_CHUTE,
  getAddressableAreaMatchForAreaId,
  getDeckDefFromRobotType,
  getFlexDeckDefAAByFixtureIdForCutoutId,
  MAGNETIC_BLOCK_V1_FIXTURE,
  MODULE_FIXTURES_BY_MODEL,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  THERMOCYCLER_MODULE_CUTOUTS,
  THERMOCYCLER_MODULE_V2,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import type { AttachedModule } from '@opentrons/api-client'
import type {
  AddressableAreaNamesWithFakes,
  CutoutConfigMap,
  CutoutFixtureId,
  CutoutId,
  CutoutIdToCutoutFixtureId,
  ModuleModel,
} from '@opentrons/shared-data'

const getFilteredModules = (
  unconfiguredMods: AttachedModule[],
  moduleModel: ModuleModel
): AttachedModule[] =>
  unconfiguredMods.filter(mod => mod.moduleModel === moduleModel)

const mapModuleToCutoutConfig = (
  module: AttachedModule,
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes,
  addressableAreasById: Record<string, unknown>
): CutoutConfigMap[] | null => {
  const keys = Object.keys(addressableAreasById)
  const cutoutFixtureId = keys.find(
    key => key === module.moduleModel
  ) as CutoutFixtureId

  if (!cutoutFixtureId) return null

  const aaforModule = getAddressableAreaMatchForAreaId(
    cutoutId,
    cutoutFixtureId,
    addressableAreaId
  )

  if (!aaforModule) return null

  return [
    {
      cutoutId,
      addressableAreaId: aaforModule,
      cutoutFixtureId,
      opentronsModuleSerialNumber: module.serialNumber,
    },
  ]
}

export const getModuleUnconfiguredFixtures = (
  unconfiguredMods: AttachedModule[],
  cutoutId: CutoutId,
  moduleModel: ModuleModel,
  addressableAreaId: AddressableAreaNamesWithFakes
): CutoutConfigMap[][] => {
  const addressableAreasById = getFlexDeckDefAAByFixtureIdForCutoutId(cutoutId)
  const filteredMods = getFilteredModules(unconfiguredMods, moduleModel)

  return filteredMods
    .map(mod =>
      mapModuleToCutoutConfig(
        mod,
        cutoutId,
        addressableAreaId,
        addressableAreasById
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
  addressableAreaId: AddressableAreaNamesWithFakes
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
      addressableAreaId
    )

    availableOptions.push(...moduleOptions)
  })

  return availableOptions
}

export const getModuleOptions = (
  cutoutId: CutoutId,
  unconfiguredMods: AttachedModule[],
  addressableAreaId: AddressableAreaNamesWithFakes
): CutoutConfigMap[][] => {
  let availableOptions: CutoutConfigMap[][] = []
  const aaMagBlockId = getAddressableAreaMatchForAreaId(
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
      ...getUnconfiguredMods(cutoutId, unconfiguredMods, addressableAreaId),
    ]
  }
  return availableOptions
}

export const getWasteChuteOptions = (
  cutoutId: CutoutId
): CutoutConfigMap[][] => {
  if (WASTE_CHUTE_CUTOUT === cutoutId) {
    return [
      [
        {
          cutoutId,
          cutoutFixtureId: WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          addressableAreaId: DEFAULT_AA_FOR_WASTE_CHUTE,
        },
      ],
    ]
  } else {
    return []
  }
}

export const getFixtureOptions = (
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes
): CutoutConfigMap[][] => {
  let availableOptions: CutoutConfigMap[][] = []
  const TrashBinAA = getAddressableAreaMatchForAreaId(
    cutoutId,
    TRASH_BIN_ADAPTER_FIXTURE,
    addressableAreaId
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

  const stagingAreaAA = getAddressableAreaMatchForAreaId(
    cutoutId,
    STAGING_AREA_RIGHT_SLOT_FIXTURE,
    addressableAreaId
  )
  if (stagingAreaAA != null) {
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
  providedFixtureOptions: CutoutFixtureId[] | undefined,
  unconfiguredMods: AttachedModule[],
  optionStage: string,
  addressableAreaId: AddressableAreaNamesWithFakes
): CutoutConfigMap[][] => {
  if (providedFixtureOptions != null) {
    return providedFixtureOptions?.map((o: CutoutFixtureId) => {
      const addressableAreasById = getFlexDeckDefAAByFixtureIdForCutoutId(
        cutoutId
      )
      const aaProvidedFixtureOptions = addressableAreasById[o]
      if (aaProvidedFixtureOptions != null) {
        const aaForFixture = getAddressableAreaMatchForAreaId(
          cutoutId,
          o,
          addressableAreaId
        )
        if (aaForFixture != null) {
          return [
            {
              cutoutId,
              cutoutFixtureId: o,
              addressableAreaId: aaForFixture,
            },
          ]
        }
      }
      return []
    })
  }
  if (optionStage === 'fixtureOptions') {
    return getFixtureOptions(cutoutId, addressableAreaId)
  }
  if (optionStage === 'moduleOptions') {
    return getModuleOptions(cutoutId, unconfiguredMods, addressableAreaId)
  }
  if (optionStage === 'wasteChuteOptions') {
    return getWasteChuteOptions(cutoutId)
  }
  return []
}
