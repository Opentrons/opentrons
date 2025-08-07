import type { QuickTransferSummaryState } from '../types'

export const getIsTouchTipEnabled = (
  sourceOrDestination:
    | QuickTransferSummaryState['source']
    | QuickTransferSummaryState['destination']
): boolean =>
  sourceOrDestination === 'source' ||
  sourceOrDestination.metadata.displayCategory !== 'reservoir'
