import * as React from 'react'

export interface TakeoverModalContextType {
  setMaintenanceInProgress: () => void
}

export const TakeoverModalContext = React.createContext<TakeoverModalContextType>(
  {
    setMaintenanceInProgress: () => {},
  }
)
