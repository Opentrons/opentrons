import { getModuleType, ModuleModel, ModuleType } from '@opentrons/shared-data'

const MODULE_TYPES_THAT_REQUIRE_EXTRA_ATTENTION = [
  'magneticModuleType',
  'thermocyclerModuleType',
] as const

export type ModuleTypesThatRequiresExtraAttention = typeof MODULE_TYPES_THAT_REQUIRE_EXTRA_ATTENTION[number]

const doesModuleRequireExtraAttention = (
  moduleType: ModuleType
): moduleType is ModuleTypesThatRequiresExtraAttention =>
  MODULE_TYPES_THAT_REQUIRE_EXTRA_ATTENTION.includes(
    moduleType as ModuleTypesThatRequiresExtraAttention
  )

export const getModuleTypesThatRequireExtraAttention = (
  moduleModels: ModuleModel[]
): ModuleTypesThatRequiresExtraAttention[] =>
  moduleModels.reduce<ModuleTypesThatRequiresExtraAttention[]>(
    (acc, moduleModel) => {
      const moduleType = getModuleType(moduleModel)
      return doesModuleRequireExtraAttention(moduleType) &&
        !acc.includes(moduleType)
        ? [...acc, moduleType]
        : [...acc]
    },
    []
  )
