import { useContext } from 'react'

import { ToasterContext } from './ToasterContext'

import type { ToasterContextType } from './ToasterContext'

export function useToaster(): ToasterContextType {
  const { eatToast, makeToast, makeSnackbar } = useContext(ToasterContext)

  return { eatToast, makeToast, makeSnackbar }
}
