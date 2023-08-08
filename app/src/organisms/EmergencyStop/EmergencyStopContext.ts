import * as React from 'react'

export interface EmergencyStopContextType {
  isEmergencyStopModalDismissed: boolean
  setIsEmergencyStopModalDismissed: (
    isEmergencyStopModalDismissed: boolean
  ) => void
}

export const EmergencyStopContext = React.createContext<EmergencyStopContextType>(
  {
    isEmergencyStopModalDismissed: false,
    setIsEmergencyStopModalDismissed: () => {},
  }
)
