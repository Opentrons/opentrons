import { ToasterContext } from './ToasterContext'
import type { ToasterContextType } from './ToasterContext'
import * as React from 'react'

export function useToaster(): ToasterContextType {
  const { eatToast, makeToast, makeSnackbar } = React.useContext(ToasterContext)

  return { eatToast, makeToast, makeSnackbar }
}
