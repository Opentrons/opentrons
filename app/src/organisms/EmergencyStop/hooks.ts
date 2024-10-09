import { useContext } from 'react'

import { EmergencyStopContext } from './EmergencyStopContext'
import type { EmergencyStopContextType } from './EmergencyStopContext'

export function useEstopContext(): EmergencyStopContextType {
  const {
    isEmergencyStopModalDismissed,
    setIsEmergencyStopModalDismissed,
  } = useContext(EmergencyStopContext)

  return {
    isEmergencyStopModalDismissed,
    setIsEmergencyStopModalDismissed,
  }
}
