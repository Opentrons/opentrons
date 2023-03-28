import * as React from 'react'

import type { ToastProps, ToastType } from '../../atoms/Toast'
import type { SnackbarProps } from '../../atoms/Snackbar'

export type MakeToastOptions = Omit<ToastProps, 'id' | 'message' | 'type'>

type MakeToast = (
  message: string,
  type: ToastType,
  options?: MakeToastOptions
) => string

type EatToast = (toastId: string) => void

export interface ToasterContextType {
  eatToast: EatToast
  makeToast: MakeToast
  eatSnackbar: EatSnackbar
  makeSnackbar: MakeSnackbar
}

export const ToasterContext = React.createContext<ToasterContextType>({
  eatToast: () => {},
  makeToast: () => '',
  eatSnackbar: () => {},
  makeSnackbar: () => {},
})

export type MakeSnackbarOptions = Omit<SnackbarProps, 'message'>

type MakeSnackbar = (message: string, options?: MakeSnackbarOptions) => void

type EatSnackbar = () => void
