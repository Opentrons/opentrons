// @flow
import * as React from 'react'
import { ScrollableAlertModal } from '../../modals'
import ReleaseNotes from '../../ReleaseNotes'
import styles from './styles.css'
import type { ButtonProps } from '@opentrons/components'
import type { BuildrootStatus } from '../../../discovery'

type Props = {
  notNowButton: ButtonProps,
  releaseNotes: ?string,
  buildrootStatus: BuildrootStatus | null,
}

export default function ReleaseNotesModal(props: Props) {
  const { notNowButton, releaseNotes, buildrootStatus } = props
  const heading =
    buildrootStatus === 'buildroot' ? 'Robot Update' : 'Robot System Update'
  const buttons = [
    notNowButton,
    {
      children: 'update robot',
      className: styles.view_update_button,
      disabled: true,
    },
  ]
  return (
    <ScrollableAlertModal heading={heading} buttons={buttons} alertOverlay>
      <ReleaseNotes source={releaseNotes} />
    </ScrollableAlertModal>
  )
}
