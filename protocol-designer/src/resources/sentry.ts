import {
  init,
  replayIntegration,
  browserTracingIntegration,
} from '@sentry/react'
import { getHasOptedIn } from '../analytics/selectors'
import type { BaseState } from '../types'

let isSentryInitialized = false

export const initializeSentry = (state: BaseState): void => {
  const optedIn = getHasOptedIn(state)?.hasOptedIn ?? false
  if (isSentryInitialized) {
    console.warn('Sentry is already initialized')
    return
  }

  const sentryDsn = process.env.OT_SENTRY_DNS
  if (sentryDsn == null) {
    console.warn('Sentry DSN not found - Sentry is not initialized')
    return
  }
  if (optedIn) {
    try {
      init({
        dsn: process.env.OT_SENTRY_DNS,
        integrations: [replayIntegration(), browserTracingIntegration()],
        tracesSampleRate: 1.0,
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/designer\.opentrons\.com/,
        ],
        replaysSessionSampleRate: 0.0, // ToDo (kk: 04/22/2025) modify the rate later
        replaysOnErrorSampleRate: 1.0,
      })
      isSentryInitialized = true
      console.log('Sentry.init done')
    } catch (error) {
      console.error('Error initializing Sentry:', error)
    }
  } else {
    console.debug('User has opted out of Sentry; stopping Sentry')
  }
}

export const getIsSentryInitialized = (): boolean => isSentryInitialized
