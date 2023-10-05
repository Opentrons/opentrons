import * as React from 'react'
import { AlertsContext } from '.'
import type { AlertsContextProps } from '.'

export function useRemoveActiveAppUpdateToast(): AlertsContextProps {
  return React.useContext(AlertsContext)
}
