import {
  browserTracingIntegration,
  captureConsoleIntegration,
  init,
  replayIntegration,
} from '@sentry/react'

import { getHasOptedIn } from '../analytics/selectors'
import { getIsProduction } from '../networking/opentronsWebApi'

import type { BaseState } from '../types'

let isSentryInitialized = false

// Note (kk: 06/09/2025) at this moment, we are not using a dev DSN
// because we are not using Sentry in development. If we decide to use it
// in the future, we can add a dev DSN here.
const sentryDsn = getIsProduction()
  ? _OT_PD_SENTRY_DSN_
  : _OT_PD_SENTRY_DEV_DSN_

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
        environment: 'production',
        release: _OT_PD_VERSION_,
        integrations: [
          captureConsoleIntegration({ levels: ['assert'] }),
          replayIntegration(),
          browserTracingIntegration(),
        ],
        attachStacktrace: true, // include stack traces in captureConsoleIntegration
        tracesSampleRate: 1.0,
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/designer\.opentrons\.com/,
        ],
        replaysSessionSampleRate: 0.0, // No Session Replay
        replaysOnErrorSampleRate: 0.0, // No Session Replay
        ignoreErrors: [/Failed to fetch/i], // Ignore the fetch since PD doesn't use fetch
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
