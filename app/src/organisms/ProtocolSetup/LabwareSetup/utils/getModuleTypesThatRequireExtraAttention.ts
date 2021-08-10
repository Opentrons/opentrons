import {
  getModuleType,
  ModuleModel,
  ModuleRealType,
} from '@opentrons/shared-data'

const MODULE_TYPES_THAT_REQUIRE_EXTRA_ATTENTION = [
  'magneticModuleType',
  'thermocyclerModuleType',
] as const

export type ModuleTypeThatRequiresExtraAttention = typeof MODULE_TYPES_THAT_REQUIRE_EXTRA_ATTENTION[number]

const doesModuleRequireExtraAttention = (
  moduleType: ModuleRealType
): moduleType is ModuleTypeThatRequiresExtraAttention =>
  MODULE_TYPES_THAT_REQUIRE_EXTRA_ATTENTION.includes(
    moduleType as ModuleTypeThatRequiresExtraAttention
  )

export const getModuleTypesThatRequireExtraAttention = (
  moduleModels: ModuleModel[]
): ModuleTypeThatRequiresExtraAttention[] =>
  moduleModels.reduce<ModuleTypeThatRequiresExtraAttention[]>(
    (acc, moduleModel) => {
      const moduleType = getModuleType(moduleModel)
      return doesModuleRequireExtraAttention(moduleType) &&
        !acc.includes(moduleType)
        ? [...acc, moduleType]
        : [...acc]
    },
    []
  )
