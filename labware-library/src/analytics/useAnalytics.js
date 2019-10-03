// @flow
import {
  persistCookies,
  initializeAnalytics,
  performOptIn,
  performOptOut,
  _getInitialAnalyticsState,
} from './utils'
import { useState, useCallback, useEffect, useMemo } from 'react'
import type { AnalyticsState } from './types'

const useAnalytics = () => {
  const [analyticsState, _setAnalyticsState] = useState<AnalyticsState>(
    _getInitialAnalyticsState
  )

  const setAnalyticsState = useMemo(
    () => (nextState: $Shape<AnalyticsState>) => {
      // every time state is update, update cookies
      persistCookies(nextState)
      _setAnalyticsState(prevState => ({ ...prevState, ...nextState }))
    },
    []
  )

  // initialize once. Empty dependency array is intentional.
  useEffect(() => {
    initializeAnalytics()
    if (analyticsState.seenOptIn) {
      // if modal isn't shown, perform opt in/out
      if (analyticsState.optedIn === true) {
        performOptIn(analyticsState)
      } else {
        performOptOut(analyticsState)
      }
    }
  }, [])

  const optInToAnalytics = useCallback(() => {
    setAnalyticsState({ seenOptIn: true, optedIn: true })
    performOptIn(analyticsState)
  }, [setAnalyticsState, analyticsState])

  const optOutOfAnalytics = useCallback(() => {
    setAnalyticsState({ seenOptIn: true, optedIn: false })
    performOptOut(analyticsState)
  }, [setAnalyticsState, analyticsState])

  return {
    optInToAnalytics,
    optOutOfAnalytics,
    analyticsState,
  }
}

export default useAnalytics
