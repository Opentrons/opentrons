import * as React from 'react'

import { EmergencyStopContext } from './EmergencyStopContext'

import type { EmergencyStopContextType } from './EmergencyStopContext'

export function useEstopContext(): EmergencyStopContextType {
  const {
    isDismissedModal,
    setIsDismissedModal,
    currentEstopStatus,
    setCurrentEstopStatus,
  } = React.useContext(EmergencyStopContext)

  return {
    isDismissedModal,
    setIsDismissedModal,
    currentEstopStatus,
    setCurrentEstopStatus,
  }
}
