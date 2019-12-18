// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import { AlertModal } from '@opentrons/components'
import { Portal } from '../portal'

import type { Error } from '../../types'

import styles from './styles.css'

type Props = {|
  heading?: ?string,
  description: string,
  close?: () => mixed,
  closeUrl?: string,
  error: Error,
|}

const DEFAULT_HEADING = 'Unexpected Error'

export function ErrorModal(props: Props) {
  const { description, error } = props
  const heading = props.heading || DEFAULT_HEADING
  let closeButtonProps = { children: 'close', onClick: props.close }

  if (props.closeUrl) {
    closeButtonProps = {
      ...closeButtonProps,
      Component: Link,
      to: props.closeUrl,
    }
  }

  return (
    <Portal>
      <AlertModal heading={heading} buttons={[closeButtonProps]} alertOverlay>
        <p className={styles.error_modal_message}>{error.message}</p>
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
