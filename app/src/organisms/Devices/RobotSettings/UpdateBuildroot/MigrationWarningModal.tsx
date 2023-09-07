import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import { AlertModal } from '@opentrons/components'
import { UPGRADE } from '../../../../redux/robot-update'

import type { ButtonProps } from '@opentrons/components'
import type { RobotUpdateType } from '../../../../redux/robot-update/types'

export interface MigrationWarningModalProps {
  notNowButton: ButtonProps
  updateType: RobotUpdateType | null
  proceed: () => unknown
}

type MaybeButtonProps = ButtonProps | null | undefined

const VIEW_UPDATE_BUTTON_STYLE = css`
  width: auto;
  min-width: 10rem;
  padding: 0.5rem 1.5rem;
`
const SYSTEM_UPDATE_MODAL_STYLE = css`
  padding: 0 1rem;
  & > p {
    margin-bottom: 1rem;
  }
`
const SYSTEM_UPDATE_WARNING_STYLE = css`
  font-weight: var(--fw-semibold);
`

export function MigrationWarningModal(
  props: MigrationWarningModalProps
): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { notNowButton, updateType, proceed } = props

  const buttons: MaybeButtonProps[] = [
    notNowButton,
    {
      children: updateType === UPGRADE ? 'view robot update' : 'update robot',
      css: VIEW_UPDATE_BUTTON_STYLE,
      onClick: proceed,
    },
  ]

  return (
    <AlertModal
      heading={t('robot_operating_update_available')}
      buttons={buttons}
      restrictOuterScroll={false}
      alertOverlay
    >
      <div css={SYSTEM_UPDATE_MODAL_STYLE}>
        <p css={SYSTEM_UPDATE_WARNING_STYLE}>
          This update is a little different than previous updates.
        </p>

        <p>
          In addition to delivering new features, this update changes the
          robot’s operating system to improve robot stability and support.
        </p>

        <p>
          Please note that this update will take up to 10 minutes, will reboot
          your robot two times, and requires your OT-2 to remain discoverable
          via USB or Wi-Fi throughout the entire migration process.
        </p>
      </div>
    </AlertModal>
  )
}
