import * as React from 'react'

import type { ToastProps, ToastType } from '../../atoms/Toast'
import type { SnackbarProps } from '../../atoms/Snackbar'

export type MakeToastOptions = Omit<
  ToastProps,
  'id' | 'message' | 'type' | 'exitNow'
>

type MakeToast = (
  message: string,
  type: ToastType,
  options?: MakeToastOptions
) => string

type EatToast = (toastId: string) => void

export interface ToasterContextType {
  eatToast: EatToast
  makeToast: MakeToast
  makeSnackbar: MakeSnackbar
}

export const ToasterContext = React.createContext<ToasterContextType>({
  eatToast: () => {},
  makeToast: () => '',
  makeSnackbar: () => {},
})

export type MakeSnackbarOptions = Omit<SnackbarProps, 'message'>

type MakeSnackbar = (
  message: string,
  duration?: number,
  options?: MakeSnackbarOptions
) => void
