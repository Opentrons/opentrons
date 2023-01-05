import { getModuleType, ModuleModel, ModuleType } from '@opentrons/shared-data'

const MODULE_TYPES_THAT_REQUIRE_EXTRA_ATTENTION = [
  'magneticModuleType',
  'thermocyclerModuleType',
  'heaterShakerModuleType',
] as const

export type ModuleTypesThatRequireExtraAttention = typeof MODULE_TYPES_THAT_REQUIRE_EXTRA_ATTENTION[number]

const doesModuleRequireExtraAttention = (
  moduleType: ModuleType
): moduleType is ModuleTypesThatRequireExtraAttention =>
  MODULE_TYPES_THAT_REQUIRE_EXTRA_ATTENTION.includes(
    moduleType as ModuleTypesThatRequireExtraAttention
  )

export const getModuleTypesThatRequireExtraAttention = (
  moduleModels: ModuleModel[]
): ModuleTypesThatRequireExtraAttention[] =>
  moduleModels.reduce<ModuleTypesThatRequireExtraAttention[]>(
    (acc, moduleModel) => {
      const moduleType = getModuleType(moduleModel)
      return doesModuleRequireExtraAttention(moduleType) &&
        !acc.includes(moduleType)
        ? [...acc, moduleType]
        : [...acc]
    },
    []
  )
