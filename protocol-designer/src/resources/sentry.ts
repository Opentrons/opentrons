import {
  browserTracingIntegration,
  captureConsoleIntegration,
  init,
  replayIntegration,
} from '@sentry/react'

import { getHasOptedIn } from '../analytics/selectors'
import { getIsProduction, getIsStaging } from '../networking/opentronsWebApi'

import type { BaseState } from '../types'

let isSentryInitialized = false

// Production DSN is shared by production and staging so sourcemaps live in one project.
// Development can still fall back to the dev DSN if it is configured locally.
const sentryDsn = _OT_PD_SENTRY_DSN_ ?? _OT_PD_SENTRY_DEV_DSN_

const resolveSentryEnvironment = ():
  | 'production'
  | 'staging'
  | 'development' => {
  if (getIsProduction()) {
    return 'production'
  }

  if (getIsStaging()) {
    return 'staging'
  }

  return 'development'
}

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
        environment: resolveSentryEnvironment(),
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
        ignoreErrors: [
          // Ignore the fetch since PD doesn't use fetch
          /Failed to fetch/i,
          // Most likely triggered by MS Defender trying to run PD. Nothing we can do but ignore it:
          // https://github.com/getsentry/sentry-javascript/issues/3440
          'Non-Error promise rejection captured with value: Object Not Found Matching Id:',
        ],
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
