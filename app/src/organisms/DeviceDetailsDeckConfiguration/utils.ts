import type { AttachedModule } from '@opentrons/api-client'
import {
  getAddressableAreaMatchForAreaId,
  getDeckDefFromRobotType,
  getFlexDeckDefAAByFixtureIdForCutoutId,
  MODULE_FIXTURES_BY_MODEL,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

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
