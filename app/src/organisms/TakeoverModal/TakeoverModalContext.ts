import * as React from 'react'

export interface TakeoverModalContextType {
  isMaintanenceInProgress: boolean
  setMaintenanceInProgress: (value: boolean) => void
  closeAndTerminate: boolean
}

export const TakeoverModalContext = React.createContext<TakeoverModalContextType>(
  {
    isMaintanenceInProgress: false,
    setMaintenanceInProgress: () => {},
    closeAndTerminate: false,
  }
)
