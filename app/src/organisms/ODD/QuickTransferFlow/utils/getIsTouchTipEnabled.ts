import { QuickTransferSummaryState } from '../types'

export const getIsTouchTipEnabled = (
  sourceOrDestination:
    | QuickTransferSummaryState['source']
    | QuickTransferSummaryState['destination']
): boolean =>
  typeof sourceOrDestination === 'object' &&
  sourceOrDestination.metadata?.displayCategory !== 'reservoir'
