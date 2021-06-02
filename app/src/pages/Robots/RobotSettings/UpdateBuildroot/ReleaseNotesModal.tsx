import * as React from 'react'
import { useDispatch } from 'react-redux'

import { buildrootChangelogSeen } from '../../../../redux/buildroot'
import { ScrollableAlertModal } from '../../../../molecules/modals'
import { ReleaseNotes } from '../../../../molecules/ReleaseNotes'
import styles from './styles.css'

import type { ButtonProps } from '@opentrons/components'
import type { Dispatch } from '../../../../redux/types'
import type { RobotSystemType } from '../../../../redux/buildroot/types'

export interface ReleaseNotesModalProps {
  robotName: string
  notNowButton: ButtonProps
  releaseNotes: string
  systemType: RobotSystemType | null
  proceed: () => unknown
}

export function ReleaseNotesModal(props: ReleaseNotesModalProps): JSX.Element {
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
