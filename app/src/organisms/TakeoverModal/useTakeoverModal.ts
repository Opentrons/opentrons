import * as React from 'react'
import {
  TakeoverModalContextType,
  TakeoverModalContext,
} from './TakeoverModalContext'

export function useTakeoverModal(): TakeoverModalContextType {
  const {
    isMaintanenceInProgress,
    setMaintenanceInProgress,
    closeAndTerminate,
  } = React.useContext(TakeoverModalContext)

  return {
    isMaintanenceInProgress,
    setMaintenanceInProgress,
    closeAndTerminate,
  }
}
