import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import styled, { css } from 'styled-components'

import {
  ALIGN_CENTER,
  Banner,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_AROUND,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  PrimaryButton,
  ReleaseNotes,
  SecondaryButton,
  SPACING,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import { ExternalLink } from '/app/atoms/Link/ExternalLink'
import { useIsRobotBusy } from '/app/redux-resources/robots'
import {
  DOWNGRADE,
  downloadRobotUpdate,
  getRobotUpdateDisplayInfo,
  getRobotUpdateVersion,
  REINSTALL,
  robotUpdateChangelogSeen,
  UPGRADE,
} from '/app/redux/robot-update'
import { useIsOEMMode } from '/app/resources/robot-settings'
import { useRobotUpdateContext } from '/app/resources/robot-update/RobotUpdateContext'

import type { ReactNode } from 'react'
import type { RobotSystemType } from '/app/redux/robot-update/types'
import type { Dispatch, State } from '/app/redux/types'

export const RELEASE_NOTES_URL_BASE =
  'https://github.com/Opentrons/opentrons/releases/tag/v'

const UpdateAppBanner = styled(Banner)`
  border: none;
`
export const FOOTER_BUTTON_STYLE = css`
  text-transform: lowercase;
  padding-left: ${SPACING.spacing16};
  padding-right: ${SPACING.spacing16};
  border-radius: ${BORDERS.borderRadius8};
  margin-top: ${SPACING.spacing16};
  margin-bottom: ${SPACING.spacing16};

  &:first-letter {
    text-transform: uppercase;
  }
`
type UpdateType = typeof UPGRADE | typeof DOWNGRADE | typeof REINSTALL | null

export interface UpdateRobotModalProps {
  robotName: string
  releaseNotes: string
  systemType: RobotSystemType
  updateType: UpdateType
  closeModal: () => void
}

export function UpdateRobotModal({
  robotName,
  releaseNotes,
  systemType,
  updateType,
  closeModal,
}: UpdateRobotModalProps): ReactNode {
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation('device_settings')
  const isOEMMode = useIsOEMMode()
  const [updateButtonProps, updateButtonTooltipProps] = useHoverTooltip()
  // TODO(jh 08-29-2023): revisit reasons that are/are not captured by this selector.
  const { updateFromFileDisabledReason } = useSelector((state: State) => {
    return getRobotUpdateDisplayInfo(state, robotName)
  })
  const { startUpdate } = useRobotUpdateContext()
  const robotUpdateVersion = useSelector((state: State) => {
    return getRobotUpdateVersion(state, robotName) ?? ''
  })

  const isRobotBusy = useIsRobotBusy()
  const updateDisabled = updateFromFileDisabledReason !== null || isRobotBusy

  let disabledReason: string = ''
  if (updateFromFileDisabledReason) {
    disabledReason = t(updateFromFileDisabledReason)
  } else if (isRobotBusy) {
    disabledReason = t('robot_busy_protocol')
  }

  useEffect(
    () => {
      dispatch(robotUpdateChangelogSeen(robotName))
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [robotName]
  )

  let heading = ''
  if (updateType === UPGRADE || updateType === DOWNGRADE) {
    heading = t('robot_operating_update_available')
  } else if (updateType === REINSTALL) {
    heading = t('robot_up_to_date')
    releaseNotes = t('robot_up_to_date_description')
  }

  const robotUpdateFooter = (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      paddingX={SPACING.spacing24}
      borderTop={BORDERS.lineBorder}
      borderColor={COLORS.grey30}
    >
      <ExternalLink
        href={`${RELEASE_NOTES_URL_BASE}${robotUpdateVersion}`}
        css={css`
          font-size: 0.875rem;
        `}
      >
        {t('release_notes')}
      </ExternalLink>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_AROUND}
        gap={SPACING.spacing8}
      >
        <SecondaryButton onClick={closeModal} css={FOOTER_BUTTON_STYLE}>
          {updateType === UPGRADE ? t('remind_me_later') : t('not_now')}
        </SecondaryButton>
        <PrimaryButton
          onClick={() => {
            dispatch(downloadRobotUpdate())
            startUpdate(robotName)
          }}
          css={FOOTER_BUTTON_STYLE}
          disabled={updateDisabled}
          {...updateButtonProps}
        >
          {t('update_robot_now')}
        </PrimaryButton>
        {updateDisabled && (
          <Tooltip tooltipProps={updateButtonTooltipProps}>
            {disabledReason}
          </Tooltip>
        )}
      </Flex>
    </Flex>
  )

  return (
    <Modal
      title={heading}
      onClose={closeModal}
      closeOnOutsideClick={true}
      footer={robotUpdateFooter}
      maxHeight="80%"
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <UpdateAppBanner type="informing" marginBottom={SPACING.spacing8}>
          {t('update_requires_restarting_robot')}
        </UpdateAppBanner>
        <ReleaseNotes source={releaseNotes} isOEMMode={isOEMMode} />
      </Flex>
    </Modal>
  )
}
