import * as React from 'react'
import { useSelector } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'

import {
  Flex,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN_REVERSE,
  JUSTIFY_CENTER,
  POSITION_FIXED,
  SPACING,
} from '@opentrons/components'

import { Snackbar } from '../../atoms/Snackbar'
import { Toast } from '../../atoms/Toast'
import { ODDToast } from '../../atoms/Toast/OnDeviceDisplay/ODDToast'
import { getIsOnDevice } from '../../redux/config'
import { ToasterContext } from './ToasterContext'

import type { SnackbarProps } from '../../atoms/Snackbar'
import type { ToastProps, ToastType } from '../../atoms/Toast'
import type {
  ODDToastProps,
  ODDToastType,
} from '../../atoms/Toast/OnDeviceDisplay/ODDToast'
import type { MakeSnackbarOptions, MakeToastOptions } from './ToasterContext'

interface ToasterOvenProps {
  children: React.ReactNode
}

const TOASTER_OVEN_SIZE = 5

/**
 * A toaster oven that renders up to 5 toasts in an app-level display container
 * @param children passes through and renders children
 * @returns
 */
export function ToasterOven({ children }: ToasterOvenProps): JSX.Element {
  const [toasts, setToasts] = React.useState<Array<ToastProps | ODDToastProps>>(
    []
  )
  const [snackbar, setSnackbar] = React.useState<SnackbarProps | null>(null)
  const isOnDevice = useSelector(getIsOnDevice)

  /**
   * makes toast, rendering it in the toaster oven display container
   * @param {string} message
   * @param {ToastType} type
   * @param {MakeToastOptions} options
   * @returns {string} returns the id to allow imperative eatToast close from caller
   */
  function makeToast(
    message: string,
    type: ToastType | ODDToastType,
    options?: MakeToastOptions
  ): string {
    const id = uuidv4()

    setToasts(t =>
      [{ id, message, type, ...options }, ...t].slice(0, TOASTER_OVEN_SIZE)
    )

    return id
  }

  function makeSnackbar(message: string, options?: MakeSnackbarOptions): void {
    setSnackbar({ message, ...options })
  }

  /**
   * removes (eats) a toast from toaster oven display container
   * @param {string} toastId the id of the toast to remove
   */
  function eatToast(toastId: string): void {
    setToasts(t => t.filter(toast => toast.id !== toastId))
  }

  return (
    <ToasterContext.Provider value={{ eatToast, makeToast, makeSnackbar }}>
      {toasts.length > 0 ? (
        <Flex
          flexDirection={DIRECTION_COLUMN_REVERSE}
          gridGap={SPACING.spacing3}
          alignItems={ALIGN_FLEX_END}
          position={POSITION_FIXED}
          right={SPACING.spacing6}
          bottom={SPACING.spacing4}
          zIndex={1000}
        >
          {toasts.map(toast => (
            <>
              {isOnDevice != null && isOnDevice ? (
                <ODDToast
                  {...(toast as ODDToastProps)}
                  key={toast.id}
                  onClose={() => {
                    toast.onClose?.()
                    eatToast(toast.id)
                  }}
                />
              ) : (
                <Toast
                  {...(toast as ToastProps)}
                  key={toast.id}
                  onClose={() => {
                    toast.onClose?.()
                    eatToast(toast.id)
                  }}
                />
              )}
            </>
          ))}
        </Flex>
      ) : null}
      {snackbar !== null && (
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          width="100%"
          position="absolute"
          bottom={SPACING.spacingXXL}
          zIndex={1000}
        >
          <Snackbar
            {...snackbar}
            onClose={() => {
              snackbar.onClose?.()
            }}
          />
        </Flex>
      )}
      {children}
    </ToasterContext.Provider>
  )
}
