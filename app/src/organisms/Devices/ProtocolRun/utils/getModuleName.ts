import { ModuleTypesThatRequireExtraAttention } from './getModuleTypesThatRequireExtraAttention'

export const getModuleName = (
  type: ModuleTypesThatRequireExtraAttention
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
