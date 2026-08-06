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

// Sentry release is normally the app version, but local builds can override it
// (e.g. `local-dev`) so locally uploaded sourcemaps resolve against local events.
const sentryRelease = _OT_PD_SENTRY_RELEASE_ ?? _OT_PD_VERSION_

const resolveSentryEnvironment = ():
  'production' | 'staging' | 'development' => {
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
        release: sentryRelease,
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
        beforeBreadcrumb(breadcrumb, hint) {
          if (
            // Sentry records breadcrumbs for HTTP requests we issue, but the Mixpanel
            // request is huge and not useful:
            breadcrumb.data?.url?.includes('/api.mixpanel.com/track') ||
            // We console.debug() every time we send an event to Mixpanel, ignore it too:
            (breadcrumb.category === 'console' && breadcrumb.level === 'debug')
          ) {
            return null
          }
          return breadcrumb
        },
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
