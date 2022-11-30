import * as React from 'react'

import { ToastContext } from './ToastContext'

import type { ToastContextType } from './ToastContext'

export function useToast(): ToastContextType {
  const { eatToast, makeToast } = React.useContext(ToastContext)

  return { eatToast, makeToast }
}
