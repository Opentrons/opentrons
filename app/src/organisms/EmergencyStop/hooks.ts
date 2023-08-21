import * as React from 'react'

import { EmergencyStopContext } from './EmergencyStopContext'
import type { EmergencyStopContextType } from './EmergencyStopContext'

export function useEstopContext(): EmergencyStopContextType {
  const {
    isEmergencyStopModalDismissed,
    setIsEmergencyStopModalDismissed,
    estoppedRobotName,
    setEstoppedRobotName,
  } = React.useContext(EmergencyStopContext)

  return {
    isEmergencyStopModalDismissed,
    setIsEmergencyStopModalDismissed,
    estoppedRobotName,
    setEstoppedRobotName,
  }
}
