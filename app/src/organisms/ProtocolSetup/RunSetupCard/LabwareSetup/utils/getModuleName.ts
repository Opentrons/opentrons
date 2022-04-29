import { ModuleTypesThatRequiresExtraAttention } from './getModuleTypesThatRequireExtraAttention'

export const getModuleName = (
  type: ModuleTypesThatRequiresExtraAttention
): 'Magnetic Module' | 'Thermocycler' | 'Heater-Shaker Module' => {
  switch (type) {
    case 'magneticModuleType':
      return 'Magnetic Module'
    case 'thermocyclerModuleType':
      return 'Thermocycler'
    case 'heaterShakerModuleType':
      return 'Heater-Shaker Module'
  }
}
