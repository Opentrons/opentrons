// @flow
// Placeholder modal for missing/downloading/errored update files

import * as React from 'react'
import { AlertModal } from '@opentrons/components'

import type { ButtonProps } from '@opentrons/components'

type Props = {
  notNowButton: ButtonProps,
  error: string | null,
  progress: number | null,
}

const HEADING = 'Robot System Update Downloading'
export default function DownloadUpdate(props: Props) {
  const { notNowButton, error, progress } = props
  let message
  if (progress) {
    message = <p>Download progress: {progress}%</p>
  } else if (error) {
    message = (
      <>
        <p>{error}</p>
        <p>Some informative text about connecting to the internet</p>
      </>
    )
  }
  return (
    <AlertModal heading={HEADING} buttons={[notNowButton]} alertOverlay>
      <h2>Screens not fully implemented!</h2>
      <h3>{message}</h3>
    </AlertModal>
  )
}
