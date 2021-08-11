import { ModuleTypesThatRequiresExtraAttention } from './getModuleTypesThatRequireExtraAttention'

export const getModuleName = (
  type: ModuleTypesThatRequiresExtraAttention
): 'Magnetic Module' | 'Thermocycler' => {
  switch (type) {
    case 'magneticModuleType':
      return 'Magnetic Module'
    case 'thermocyclerModuleType':
      return 'Thermocycler'
  }
}
