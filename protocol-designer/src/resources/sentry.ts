import {
  browserTracingIntegration,
  captureConsoleIntegration,
  close,
  init,
  replayIntegration,
} from '@sentry/react'

import { getHasOptedIn } from '../analytics/selectors'
import { getIsProduction, getIsStaging } from '../networking/opentronsWebApi'

import type { BaseState } from '../types'

let isSentryInitialized = false

// Production DSN is shared by production and staging so sourcemaps live in one project.
// Development can still fall back to the dev DSN if it is configured locally.
const sentryDsn =
  typeof _OT_PD_SENTRY_DSN_ !== 'undefined'
    ? _OT_PD_SENTRY_DSN_
    : typeof _OT_PD_SENTRY_DEV_DSN_ !== 'undefined'
      ? _OT_PD_SENTRY_DEV_DSN_
      : undefined

// Sentry release is normally the app version, but local builds can override it
// (e.g. `local-dev`) so locally uploaded sourcemaps resolve against local events.
const sentryRelease =
  typeof _OT_PD_SENTRY_RELEASE_ !== 'undefined'
    ? _OT_PD_SENTRY_RELEASE_
    : typeof _OT_PD_VERSION_ !== 'undefined'
      ? _OT_PD_VERSION_
      : undefined

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

const startSentry = (): void => {
  if (isSentryInitialized) {
    console.warn('Sentry is already initialized')
    return
  }

  if (sentryDsn == null) {
    console.warn('Sentry DSN not found - Sentry is not initialized')
    return
  }

  try {
    const client = init({
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
        /^https:\/\/designer\.opentrons\.com(?::443)?(?:\/|$)/,
        /^https?:\/\/localhost(?::\d+)?(?:\/|$)/,
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

    if (client == null) {
      console.warn('Sentry.init did not create a client')
      return
    }

    isSentryInitialized = true
    console.log('Sentry.init done')
  } catch (error) {
    console.error('Error initializing Sentry:', error)
  }
}

export const setSentryTracking = (optedIn: boolean): void => {
  if (optedIn) {
    startSentry()
    return
  }

  if (isSentryInitialized) {
    isSentryInitialized = false
    void close().catch(error => {
      console.error('Error stopping Sentry:', error)
    })
  }
  console.debug('User has opted out of Sentry; Sentry is stopped')
}

export const initializeSentry = (state: BaseState): void => {
  const optedIn = getHasOptedIn(state)?.hasOptedIn ?? false
  setSentryTracking(optedIn)
}
