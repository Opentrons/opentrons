// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'

import { buildrootChangelogSeen } from '../../../buildroot'
import { ScrollableAlertModal } from '../../modals'
import { ReleaseNotes } from '../../ReleaseNotes'
import styles from './styles.css'

import type { ButtonProps } from '@opentrons/components'
import type { Dispatch } from '../../../types'
import type { RobotSystemType } from '../../../buildroot/types'

export type ReleaseNotesModalProps = {|
  robotName: string,
  notNowButton: ButtonProps,
  releaseNotes: string,
  systemType: RobotSystemType | null,
  proceed: () => mixed,
|}

export function ReleaseNotesModal(props: ReleaseNotesModalProps): React.Node {
  const { robotName, notNowButton, releaseNotes, systemType, proceed } = props
  const dispatch = useDispatch<Dispatch>()

  React.useEffect(() => {
    dispatch(buildrootChangelogSeen(robotName))
  }, [dispatch, robotName])

  const heading =
    systemType === 'buildroot'
      ? 'Robot Update'
      : 'Robot Operating System Update'

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
