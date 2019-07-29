// @flow
import * as React from 'react'
import { ScrollableAlertModal } from '../../modals'
import ReleaseNotes from '../../ReleaseNotes'
import styles from './styles.css'
import type { ButtonProps } from '@opentrons/components'
import type { RobotSystemType } from '../../../shell'

type Props = {
  notNowButton: ButtonProps,
  releaseNotes: string,
  systemType: RobotSystemType | null,
  proceed: () => mixed,
}

export default function ReleaseNotesModal(props: Props) {
  const { notNowButton, releaseNotes, systemType, proceed } = props
  const heading =
    systemType === 'buildroot' ? 'Robot Update' : 'Robot System Update'
  const buttons = [
    notNowButton,
    {
      onClick: proceed,
      children: 'update robot',
      className: styles.view_update_button,
    },
  ]

  return (
    <ScrollableAlertModal
      heading={heading}
      buttons={buttons}
      restrictOuterScroll={false}
      alertOverlay
    >
      <ReleaseNotes source={releaseNotes} />
    </ScrollableAlertModal>
  )
}
