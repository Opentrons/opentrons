import * as React from 'react'

import { EmergencyStopContext } from './EmergencyStopContext'
import type { EmergencyStopContextType } from './EmergencyStopContext'

export function useEstopContext(): EmergencyStopContextType {
  const {
    isEmergencyStopModalDismissed,
    setIsEmergencyStopModalDismissed,
  } = React.useContext(EmergencyStopContext)

  return {
    isEmergencyStopModalDismissed,
    setIsEmergencyStopModalDismissed,
  }
}
