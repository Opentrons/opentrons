import {
  browserTracingIntegration,
  init,
  replayIntegration,
} from '@sentry/react'

import { getHasOptedIn } from '../analytics/selectors'
import { getIsProduction } from '../networking/opentronsWebApi'

import type { BaseState } from '../types'

let isSentryInitialized = false

const sentryDsn = getIsProduction()
  ? process.env.OT_PD_SENTRY_DNS
  : process.env.OT_PD_SENTRY_DEV_DNS

export const initializeSentry = (state: BaseState): void => {
  const optedIn = getHasOptedIn(state)?.hasOptedIn ?? false
  if (isSentryInitialized) {
    console.warn('Sentry is already initialized')
    return
  }

  if (sentryDsn == null) {
    console.warn('Sentry DSN not found - Sentry is not initialized')
    return
  }
  if (optedIn) {
    try {
      init({
        dsn: sentryDsn,
        integrations: [replayIntegration(), browserTracingIntegration()],
        tracesSampleRate: 1.0,
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/designer\.opentrons\.com/,
        ],
        replaysSessionSampleRate: 0.0, // No Session Replay
        replaysOnErrorSampleRate: 0.0, // No Session Replay
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
