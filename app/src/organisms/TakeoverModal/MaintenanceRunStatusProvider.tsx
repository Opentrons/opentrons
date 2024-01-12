import * as React from 'react'

import { useNotifyCurrentMaintenanceRun } from '../../resources/notify/useNotifyCurrentMaintenanceRun'

interface MaintenanceRunIds {
  currentRunId: string | null
  oddRunId: string | null
}

export interface MaintenanceRunStatus {
  getRunIds: () => MaintenanceRunIds
  setOddRunIds: (state: MaintenanceRunIds) => void
}

export const MaintenanceRunContext = React.createContext<MaintenanceRunStatus>({
  getRunIds: () => ({ currentRunId: null, oddRunId: null }),
  setOddRunIds: () => {},
})

interface MaintenanceRunProviderProps {
  children?: React.ReactNode
}

export function MaintenanceRunStatusProvider(
  props: MaintenanceRunProviderProps
): JSX.Element {
  const [oddRunIds, setOddRunIds] = React.useState<MaintenanceRunIds>({
    currentRunId: null,
    oddRunId: null,
  })

  const currentRunIdQueryResult = useNotifyCurrentMaintenanceRun({
    refetchInterval: 5000,
  }).data?.data.id

  React.useEffect(() => {
    setOddRunIds(prevState => ({
      ...prevState,
      currentRunId: currentRunIdQueryResult ?? null,
    }))
  }, [currentRunIdQueryResult])

  const maintenanceRunStatus = React.useMemo(
    () => ({
      getRunIds: () => oddRunIds,
      setOddRunIds,
    }),
    [oddRunIds]
  )

  return (
    <MaintenanceRunContext.Provider value={maintenanceRunStatus}>
      {props.children}
    </MaintenanceRunContext.Provider>
  )
}
