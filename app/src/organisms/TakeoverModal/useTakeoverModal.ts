import * as React from 'react'
import {
  TakeoverModalContextType,
  TakeoverModalContext,
} from './TakeoverModalContext'

export function useTakeoverModal(): TakeoverModalContextType {
  const { setMaintenanceInProgress } = React.useContext(TakeoverModalContext)

  return {
    setMaintenanceInProgress,
  }
}
