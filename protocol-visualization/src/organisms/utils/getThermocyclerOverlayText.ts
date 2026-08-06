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
      //  TODO: the rest of the copy isn't needed for protocol viz user testing purposes
      return 'Changing thermocycler state'
  }
}
