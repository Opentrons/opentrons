import * as React from 'react'

export interface EmergencyStopContextType {
  isEmergencyStopModalDismissed: boolean
  setIsEmergencyStopModalDismissed: (
    isEmergencyStopModalDismissed: boolean
  ) => void
  estoppedRobotName: string | null
  setEstoppedRobotName: (estoppedRobotName: string | null) => void
}

export const EmergencyStopContext = React.createContext<EmergencyStopContextType>(
  {
    isEmergencyStopModalDismissed: false,
    setIsEmergencyStopModalDismissed: () => {},
    estoppedRobotName: null,
    setEstoppedRobotName: () => {},
  }
)
