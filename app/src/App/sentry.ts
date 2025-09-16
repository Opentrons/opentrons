import {
  browserTracingIntegration,
  captureConsoleIntegration,
  functionToStringIntegration,
  getDefaultIntegrations,
  init,
} from '@sentry/electron/renderer'

import { CURRENT_VERSION } from '/app/redux/shell'

let isSentryInitialized = false

// Sentry doesn't expose this type publicly.
interface ElectronRendererOptions {
  dsn?: string
  release?: string
  environment?: string
  tracesSampleRate?: number
}

export const initializeSentry = (isAnalyticsEnabled: boolean): void => {
  if (isSentryInitialized) {
    console.info('Sentry is already initialized, skipping...')
    return
  }

  if (!isAnalyticsEnabled) {
    console.log('Analytics disabled. Sentry not initialized.')
    return
  }

  if (_OT_SENTRY_DSN_ == null) {
    console.log('Sentry DSN not found. Sentry is not initialized.')
    return
  }

  const sentryOptions: ElectronRendererOptions = {
    dsn: _OT_SENTRY_DSN_,
    environment: _NODE_ENV_,
    release: CURRENT_VERSION,
    tracesSampleRate: 1.0,
  }

  try {
    init({
      ...sentryOptions,
      integrations: [
        ...getDefaultIntegrations(sentryOptions),
        functionToStringIntegration(),
        captureConsoleIntegration({ levels: ['error'] }),
        browserTracingIntegration(),
      ],
      beforeSend(event, hint) {
        const error = hint.originalException || hint.syntheticException
        const errorMessage = ((): string => {
          if (error == null || Object.keys(error).length === 0) {
            return ''
          }
          // @ts-expect-error - Object has keys.
          else if ('message' in error && typeof error.message === 'string') {
            return error.message
          } else {
            return event.message ?? ''
          }
        })()

        if (
          errorMessage.includes('403') ||
          errorMessage.includes('404') ||
          errorMessage.includes('503')
        ) {
          return null
        }

        // Filter out network/fetch errors.
        if (
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Failed to load resource') ||
          errorMessage.includes('ERR_INTERNET_DISCONNECTED')
        ) {
          return null
        }

        return event
      },
    })

    isSentryInitialized = true
    console.log('Sentry initialized successfully.')
  } catch (error) {
    console.error('Error initializing Sentry:', { error })
  }
}
