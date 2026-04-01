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
    debug: true,
  }
  try {
    init({
      ...sentryOptions,
      integrations: () => [
        // the sentry gpu integration will cause an event storm that doesn't let the
        // ODD launch on the robot, for some reason. everything else is fine
        ...getDefaultIntegrations(sentryOptions).filter(
          integration => integration.name !== 'GpuContext'
        ),
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
