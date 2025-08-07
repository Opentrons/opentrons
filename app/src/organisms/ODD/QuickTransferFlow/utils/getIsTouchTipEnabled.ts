import type { QuickTransferSummaryState } from '../types'

export const getIsTouchTipEnabled = (
  sourceOrDestination:
    | QuickTransferSummaryState['source']
    | QuickTransferSummaryState['destination']
): boolean =>
  sourceOrDestination === 'source' ||
  (sourceOrDestination.parameters.quirks?.includes('touchTipDisabled') ?? true)
