import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { useCurrentRunId } from '/app/resources/runs'

import { CURRENT_RUN_POLL } from './constants'
import { useCurrentRunRoute } from './hooks'

export function ODDTopLevelRedirects(): JSX.Element | null {
  const currentRunId = useCurrentRunId({ refetchInterval: CURRENT_RUN_POLL })

  // If the run has been dismissed on the desktop app, we still need to safely redirect away from the run routes.
  const currentRoute = useLocation()
  if (currentRunId == null && currentRoute.pathname.includes('/runs/')) {
    // '/runs/1234/setup' -> '1234'
    // eslint-disable-next-line no-useless-escape
    const lastRunId = /\/runs\/([^\/\s]*)\//.exec(currentRoute.pathname)?.[1]
    if (!!lastRunId) {
      return <CurrentRunRoute currentRunId={lastRunId} />
    }
  }

  return currentRunId != null ? (
    <CurrentRunRoute currentRunId={currentRunId} />
  ) : null
}

function CurrentRunRoute({
  currentRunId,
}: {
  currentRunId: string
}): JSX.Element | null {
  const currentRunRoute = useCurrentRunRoute(currentRunId)

  return currentRunRoute != null ? (
    <Routes>
      <Route path="*" element={<Navigate to={currentRunRoute} />} />
    </Routes>
  ) : null
}
