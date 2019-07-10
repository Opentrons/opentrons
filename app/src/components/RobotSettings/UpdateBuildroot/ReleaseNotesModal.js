// @flow
import * as React from 'react'
import { ScrollableAlertModal } from '../../modals'
import ReleaseNotes from '../../ReleaseNotes'
import styles from './styles.css'
import type { ButtonProps } from '@opentrons/components'

type Props = {
  notNowButton: ButtonProps,
  releaseNotes: ?string,
}

export default function ReleaseNotesModal(props: Props) {
  const { notNowButton, releaseNotes } = props
  const buttons = [
    notNowButton,
    {
      children: 'update robot',
      className: styles.view_update_button,
      disabled: true,
    },
  ]
  return (
    <ScrollableAlertModal
      heading="Robot System Update"
      buttons={buttons}
      alertOverlay
    >
      <ReleaseNotes source={releaseNotes} />
    </ScrollableAlertModal>
  )
}
