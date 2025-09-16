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

const SENTRY_DSN = process.env.OT_SENTRY_DSN
const NODE_ENV = process.env.NODE_ENV

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

  if (SENTRY_DSN == null) {
    log.debug('Sentry DSN not found. Sentry is not initialized.')
    return
  }

  const sentryOptions: ElectronMainOptions = {
    dsn: SENTRY_DSN,
    environment: NODE_ENV,
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
