import * as React from 'react'
import { Link } from 'react-router-dom'
import { AlertModal } from '@opentrons/components'
import { Portal } from '../../App/portal'

import styles from './styles.css'
import type { ButtonProps } from '@opentrons/components'

interface Props {
  heading?: string | null
  description: string
  close?: () => unknown
  closeUrl?: string
  error: { message?: string; [key: string]: unknown } | null
}

const DEFAULT_HEADING = 'Unexpected Error'
const AN_UNKNOWN_ERROR_OCCURRED = 'An unknown error occurred'

export function ErrorModal(props: Props): JSX.Element {
  const { description, error } = props
  const heading = props.heading != null ? props.heading : DEFAULT_HEADING
  let closeButtonProps: ButtonProps = {
    children: 'close',
    onClick: props.close,
  }

  if (props.closeUrl != null) {
    closeButtonProps = {
      ...closeButtonProps,
      Component: Link,
      to: props.closeUrl,
    }
  }

  return (
    <Portal>
      <AlertModal heading={heading} buttons={[closeButtonProps]} alertOverlay>
        <p className={styles.error_modal_message}>
          {error?.message ?? AN_UNKNOWN_ERROR_OCCURRED}
        </p>
        <p>{description}</p>
        <p>
          If you keep getting this message, try restarting your app and/or
          robot. If this does not resolve the issue please contact Opentrons
          Support.
        </p>
      </AlertModal>
    </Portal>
  )
}
