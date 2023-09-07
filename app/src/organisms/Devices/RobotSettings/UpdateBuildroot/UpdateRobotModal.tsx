import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import styled, { css } from 'styled-components'

import {
  useHoverTooltip,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  SPACING,
  Flex,
  NewPrimaryBtn,
  NewSecondaryBtn,
  BORDERS,
} from '@opentrons/components'

import {
  getRobotUpdateDisplayInfo,
  robotUpdateChangelogSeen,
  startRobotUpdate,
  OT2_BALENA,
} from '../../../../redux/robot-update'
import { ReleaseNotes } from '../../../../molecules/ReleaseNotes'
import { useIsRobotBusy } from '../../hooks'
import { Tooltip } from '../../../../atoms/Tooltip'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { Banner } from '../../../../atoms/Banner'

import type { State, Dispatch } from '../../../../redux/types'
import type { RobotSystemType } from '../../../../redux/robot-update/types'

const UpdateAppBanner = styled(Banner)`
  border: none;
`
export const FOOTER_BUTTON_STYLE = css`
  text-transform: lowercase;
  padding-left: ${SPACING.spacing16};
  padding-right: ${SPACING.spacing16};
  border-radius: ${BORDERS.borderRadiusSize1};
  margin-top: ${SPACING.spacing16};
  margin-bottom: ${SPACING.spacing16};

  &:first-letter {
    text-transform: uppercase;
  }
`

export interface UpdateRobotModalProps {
  robotName: string
  releaseNotes: string
  systemType: RobotSystemType | null
  closeModal: () => void
}

export function UpdateRobotModal({
  robotName,
  releaseNotes,
  systemType,
  closeModal,
}: UpdateRobotModalProps): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation('device_settings')
  const [updateButtonProps, updateButtonTooltipProps] = useHoverTooltip()
  // TODO(jh 08-29-2023): revisit reasons that are/are not captured by this selector.
  const { updateFromFileDisabledReason } = useSelector((state: State) => {
    return getRobotUpdateDisplayInfo(state, robotName)
  })
  const isRobotBusy = useIsRobotBusy()
  const updateDisabled = updateFromFileDisabledReason !== null || isRobotBusy

  let disabledReason: string = ''
  if (updateFromFileDisabledReason)
    disabledReason = updateFromFileDisabledReason
  else if (isRobotBusy) disabledReason = t('robot_busy_protocol')

  React.useEffect(() => {
    dispatch(robotUpdateChangelogSeen(robotName))
  }, [robotName])

  const heading =
    systemType === OT2_BALENA
      ? 'Robot Operating System Update'
      : `${robotName} ${t('update_available')}`

  const robotUpdateFooter = (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_FLEX_END}>
      <NewSecondaryBtn
        onClick={closeModal}
        marginRight={SPACING.spacing8}
        css={FOOTER_BUTTON_STYLE}
      >
        {t('remind_me_later')}
      </NewSecondaryBtn>
      <NewPrimaryBtn
        onClick={() => dispatch(startRobotUpdate(robotName))}
        marginRight={SPACING.spacing12}
        css={FOOTER_BUTTON_STYLE}
        disabled={updateDisabled}
        {...updateButtonProps}
      >
        {t('update_robot_now')}
      </NewPrimaryBtn>
      {updateDisabled && (
        <Tooltip tooltipProps={updateButtonTooltipProps}>
          {disabledReason}
        </Tooltip>
      )}
    </Flex>
  )

  return (
    <LegacyModal
      title={heading}
      onClose={closeModal}
      closeOnOutsideClick={true}
      footer={robotUpdateFooter}
      maxHeight="80%"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <UpdateAppBanner type="informing" marginBottom={SPACING.spacing8}>
          {t('updating_robot_system')}
        </UpdateAppBanner>
        <ReleaseNotes source={releaseNotes} />
      </Flex>
    </LegacyModal>
  )
}
