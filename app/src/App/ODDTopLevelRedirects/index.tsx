import { Navigate, Route, Routes } from 'react-router-dom'

import { useCurrentRunId } from '/app/resources/runs'
import { CURRENT_RUN_POLL } from './constants'
import { useCurrentRunRoute } from './hooks'

export function ODDTopLevelRedirects(): JSX.Element | null {
  const currentRunId = useCurrentRunId({ refetchInterval: CURRENT_RUN_POLL })

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
