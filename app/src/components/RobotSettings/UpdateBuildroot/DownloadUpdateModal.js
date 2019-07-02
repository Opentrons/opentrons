// @flow
// Placeholder modal for missing/downloading/errored update files

import * as React from 'react'
import { AlertModal } from '@opentrons/components'

import type { ButtonProps } from '@opentrons/components'

type Props = {
  notNowButton: ButtonProps,
}

const HEADING = 'Robot System Update Downloading'
export default function DownloadUpdate(props: Props) {
  const { notNowButton } = props
  return (
    <AlertModal heading={HEADING} buttons={[notNowButton]} alertOverlay>
      <h2>screen not implemented</h2>
    </AlertModal>
  )
}
