import * as React from 'react'

export interface EmergencyStopContextType {
  isDismissedModal: boolean
  setIsDismissedModal: (isDismissedModal: boolean) => void
}

export const EmergencyStopContext = React.createContext<EmergencyStopContextType>(
  {
    isDismissedModal: false,
    setIsDismissedModal: () => {},
  }
)
