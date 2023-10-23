import * as React from 'react'
import { MaintenanceRunContext } from './MaintenanceRunStatusProvider'
import type { MaintenanceRunStatus } from './MaintenanceRunStatusProvider'

export function useMaintenanceRunTakeover(): MaintenanceRunStatus {
  return React.useContext(MaintenanceRunContext)
}
