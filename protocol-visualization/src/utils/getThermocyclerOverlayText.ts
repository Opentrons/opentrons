import type { RunTimeCommand } from '@opentrons/shared-data'

export const getThermocyclerOverlayText = (
  commandType: RunTimeCommand['commandType']
): string => {
  switch (commandType) {
    case 'loadModule':
      return 'Load Thermocycler'
    case 'thermocycler/openLid':
      return 'Opening lid'
    case 'thermocycler/closeLid':
      return 'Closing lid'
    case 'thermocycler/setTargetBlockTemperature':
      return 'Setting block temperature'
    case 'thermocycler/waitForLidTemperature':
      return 'Setting lid temperature'
    default:
      return 'Changing thermocycler state'
  }
}
