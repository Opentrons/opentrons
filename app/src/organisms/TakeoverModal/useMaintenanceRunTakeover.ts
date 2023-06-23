import * as React from 'react'
import {
  TakeoverModalContextType,
  TakeoverModalContext,
} from './TakeoverModalContext'

export function useMaintenanceRunTakeover(): TakeoverModalContextType {
  const { setODDMaintenanceFlowInProgress } = React.useContext(
    TakeoverModalContext
  )

  return {
    setODDMaintenanceFlowInProgress,
  }
}
