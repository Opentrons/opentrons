import { getInitialSummaryState } from './getInitialSummaryState'
import { retrieveLiquidClassValues } from './retrieveLiquidClassValues'

import type { QuickTransferSummaryState } from '../types'
import type { InitialSummaryStateProps } from './getInitialSummaryState'

export const initializeSummaryState = (
  props: InitialSummaryStateProps
): QuickTransferSummaryState => {
  const baseState = getInitialSummaryState(props)

  const liquidClassValues = retrieveLiquidClassValues(baseState, 'all')

  return {
    ...baseState,
    ...liquidClassValues,
    liquidClassValuesInitialized: true,
  }
}
