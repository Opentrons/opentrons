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
  console.log('=>(sentry.ts:40) _OT_SENTRY_DSN_', _OT_SENTRY_DSN_)

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
    })

    isSentryInitialized = true
    log.info('Sentry initialized successfully.')
  } catch (error) {
    log.error('Error initializing Sentry:', { error })
  }
}
