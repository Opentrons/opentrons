import { useEffect } from 'react'
import { captureException } from '@sentry/electron/renderer'
import { v4 as uuidv4 } from 'uuid'

/**
 * Report an error to sentry if it falls to an error boundary.
 */
export function useSentryReport(error: any): void {
  const errorId = uuidv4()

  useEffect(() => {
    if (error != null) {
      captureException(error, { extra: { errorId }, level: 'error' })
    }
  }, [error, errorId])
}
