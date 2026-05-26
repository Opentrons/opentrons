import { useEffect } from 'react'

import { useSentryReport } from '/app/App/hooks/useSentryReport'
import { remote } from '/app/redux/shell/remote'

import type { FallbackProps } from 'react-error-boundary'

export function SecondaryWindowAppFallback({
  error,
}: FallbackProps): JSX.Element | null {
  useSentryReport(error)

  useEffect(() => {
    // close the Window
    remote.ipcRenderer.send('secondary-window:close-self')
  }, [])

  return null
}
