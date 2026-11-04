import {
  additionalContextIntegration,
  electronMinidumpIntegration,
  functionToStringIntegration,
  getDefaultIntegrations,
  init,
} from '@sentry/electron/main'
import { app } from 'electron'

import { createLogger } from './log'

import type { ElectronMainOptions } from '@sentry/electron/main'

let isSentryInitialized = false

const log = createLogger('sentry')

export const initializeSentry = (isAnalyticsEnabled: boolean): void => {
  if (isSentryInitialized) {
    log.warn('Sentry is already initialized')
    return
  }

  if (!isAnalyticsEnabled) {
    log.debug('Analytics disabled. Sentry not initialized.')
    return
  }

  if (_OT_SENTRY_DSN_ == null) {
    log.debug('Sentry DSN not found. Sentry is not initialized.')
    return
  }

  const sentryOptions: ElectronMainOptions = {
    dsn: _OT_SENTRY_DSN_,
    environment: _NODE_ENV_,
    release: app.getVersion(),
    tracesSampleRate: 1.0,
  }

  try {
    init({
      ...sentryOptions,
      integrations: [
        ...getDefaultIntegrations(sentryOptions),
        additionalContextIntegration({
          deviceModelManufacturer: true,
        }),
        electronMinidumpIntegration(),
        functionToStringIntegration(),
      ],
      beforeSend(event, hint) {
        const error = hint.originalException || hint.syntheticException
        const errorMessage = ((): string => {
          // this function is called on messages passed with captureMessage, which are
          // just strings
          if (typeof error === 'string') {
            return error
          }
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
          errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
          errorMessage.includes('EHOSTUNREACH')
        ) {
          return null
        }
        return event
      },
      beforeSendTransaction(event) {
        if (event.transaction === '/') {
          return null
        }
        return event
      },
    })

    isSentryInitialized = true
    log.info('Sentry initialized successfully.')
  } catch (error) {
    log.error('Error initializing Sentry:', { error })
  }
}
