import * as React from 'react'

import type { ToastProps, ToastType } from '../../atoms/Toast'
import type {
  ODDToastProps,
  ODDToastType,
} from '../../atoms/Toast/OnDeviceDisplay/ODDToast'
import type { SnackbarProps } from '../../atoms/Snackbar'

export type MakeToastOptions = Omit<ToastProps, 'id' | 'message' | 'type'>

export type MakeTODDoastOptions = Omit<ODDToastProps, 'id' | 'message' | 'type'>

type MakeToast = (
  message: string,
  type: ToastType | ODDToastType,
  options?: MakeToastOptions | MakeTODDoastOptions
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

type MakeSnackbar = (message: string, options?: MakeSnackbarOptions) => void
