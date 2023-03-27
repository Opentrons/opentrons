import * as React from 'react'

import { ToastContext } from './ToastContext'

import type { ToastContextType } from './ToastContext'

export function useToast(): ToastContextType {
  const { eatToast, makeToast, eatSnackbar, makeSnackbar } = React.useContext(
    ToastContext
  )

  return { eatToast, makeToast, eatSnackbar, makeSnackbar }
}
