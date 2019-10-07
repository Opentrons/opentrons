// @flow
// A hook for analytics opt in/out components (eg modals or toggles)
// Uses cookie as initial source of truth. Will write a cookie if none exists.
import {
  persistAnalyticsCookie,
  initializeAnalytics,
  performOptIn,
  performOptOut,
  _getInitialAnalyticsState,
} from './utils'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { AnalyticsState } from './types'

const useAnalyticsOptInOrOut = () => {
  const _initalAnalyticsStateRef = useRef<AnalyticsState>(
    _getInitialAnalyticsState()
  )

  // initialize once using values in cookie (or default initial values, if no cookie)
  useEffect(() => {
    initializeAnalytics()
    const initialState = _initalAnalyticsStateRef.current
    if (initialState.seenOptIn) {
      // if modal isn't shown, perform opt in/out
      if (initialState.optedIn === true) {
        performOptIn(initialState)
      } else {
        performOptOut(initialState)
      }
    }
  }, [])

  const [analyticsState, _setAnalyticsState] = useState<AnalyticsState>(
    _initalAnalyticsStateRef.current
  )
  const setAnalyticsState = useMemo(
    () => (nextState: $Shape<AnalyticsState>) => {
      // every time state is updated, also update cookies
      persistAnalyticsCookie(nextState)
      _setAnalyticsState(prevState => ({ ...prevState, ...nextState }))
    },
    []
  )

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

export default useAnalyticsOptInOrOut
