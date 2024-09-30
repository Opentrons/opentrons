import { createContext } from 'react'

export interface EmergencyStopContextType {
  isEmergencyStopModalDismissed: boolean
  setIsEmergencyStopModalDismissed: (
    isEmergencyStopModalDismissed: boolean
  ) => void
}

export const EmergencyStopContext = createContext<EmergencyStopContextType>({
  isEmergencyStopModalDismissed: false,
  setIsEmergencyStopModalDismissed: () => {},
})
