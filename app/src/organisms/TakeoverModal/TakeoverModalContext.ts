import * as React from 'react'

export interface TakeoverModalContextType {
  setODDMaintenanceFlowInProgress: () => void
}

export const TakeoverModalContext = React.createContext<TakeoverModalContextType>(
  {
    setODDMaintenanceFlowInProgress: () => {},
  }
)
