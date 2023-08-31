import * as React from 'react'
import { useCurrentMaintenanceRun } from '@opentrons/react-api-client'

interface MaintenanceRunIds {
  currentRunId: string | null
  oddRunId: string | null
}

export interface MaintenanceRunStatus {
  getRunIds: () => MaintenanceRunIds
  setOddRunId: (runId: string) => void
}

export const MaintenanceRunContext = React.createContext<MaintenanceRunStatus>({
  getRunIds: () => ({ currentRunId: null, oddRunId: null }),
  setOddRunId: () => {},
})

interface MaintenanceRunProviderProps {
  children?: React.ReactNode
}

export function MaintenanceRunStatusProvider(
  props: MaintenanceRunProviderProps
): JSX.Element {
  const [oddRunId, setOddRunId] = React.useState<string | null>(null)

  const currentRunId = useCurrentMaintenanceRun({
    refetchInterval: 5000,
  }).data?.data.id

  const maintenanceRunStatus = React.useMemo(
    () => ({
      getRunIds: () => ({ currentRunId: currentRunId ?? null, oddRunId }),
      setOddRunId,
    }),
    [oddRunId, currentRunId]
  )

  return (
    <MaintenanceRunContext.Provider value={maintenanceRunStatus}>
      {props.children}
    </MaintenanceRunContext.Provider>
  )
}
