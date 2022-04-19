import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import { getShellUpdateState } from '../../../../redux/shell'
import { useCurrentRunId } from '../../../../organisms/ProtocolUpload/hooks'
import { ReleaseNotes } from '../../../../molecules/ReleaseNotes'
import { StyledText } from '../../../../atoms/text'
import { ExternalLink } from '../../../../atoms/Link/ExternalLink'
import { PrimaryButton, SecondaryButton } from '../../../../atoms/Buttons'
import { Banner } from '../../../../atoms/Banner'
import { Modal } from '../../../../atoms/Modal'
import { Divider } from '../../../../atoms/structure'

const TECHNICAL_CHANGE_LOG_URL =
  'https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md'
const ISSUE_TRACKER_URL =
  'https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug'
const RELEASE_NOTES_URL = 'https://github.com/Opentrons/opentrons/releases'

interface SoftwareUpdateModalProps {
  //   robotName: string
  closeModal: () => void
}

export function SoftwareUpdateModal({
  //   robotName,
  closeModal,
}: SoftwareUpdateModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  // TODO: CHeck protocol is running
  const currentRunId = useCurrentRunId()
  const updateState = useSelector(getShellUpdateState)
  const { downloaded, downloading, error, info: updateInfo } = updateState
  const version = updateInfo?.version ?? ''
  const releaseNotes = updateInfo?.releaseNotes

  return (
    <Modal
      title={
        currentRunId != null
          ? t('software_update_modal_protocol_running_banner_message')
          : t('Robot Update Available')
      }
      onClose={closeModal}
    >
      <Banner
        type="informing"
        title={t('Updating the robot’s software requires restarting the robot')}
      ></Banner>
      <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing4}>
        {/* <ReleaseNotes source={releaseNotes} /> ToDo: align with new design */}
        <StyledText css={TYPOGRAPHY.pSemiBold}>
          {t('software_update_modal_app_change_label', {
            version: `${version}`,
          })}
        </StyledText>
        <StyledText as="p">{'None in the Opentrons dummy text'}</StyledText>
        <StyledText css={TYPOGRAPHY.pSemiBold} marginTop={SPACING.spacing3}>
          {t('software_update_modal_new_features_label')}
        </StyledText>
        <StyledText as="p">{'None in the Opentrons dummy text'}</StyledText>
        <StyledText css={TYPOGRAPHY.pSemiBold} marginTop={SPACING.spacing3}>
          {t('software_update_modal_but_fixes_label')}
        </StyledText>
        <StyledText as="p">{'None in the Opentrons dummy text'}</StyledText>
        <Divider />
        <ExternalLink
          href={TECHNICAL_CHANGE_LOG_URL}
          css={TYPOGRAPHY.pSemiBold}
          id=""
        >
          {t('software_update_modal_technical_change_log_link')}
        </ExternalLink>
        <ExternalLink
          href={ISSUE_TRACKER_URL}
          css={TYPOGRAPHY.pSemiBold}
          id=""
          marginBottom={SPACING.spacing3}
        >
          {t('software_update_modal_issue_tracker_link')}
        </ExternalLink>
        <ExternalLink
          href={RELEASE_NOTES_URL}
          css={TYPOGRAPHY.pSemiBold}
          id=""
          marginBottom={SPACING.spacing3}
        >
          {t('software_update_modal_release_notes_link')}
        </ExternalLink>
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <SecondaryButton
            onClick={() => {}}
            marginRight={SPACING.spacing3}
            marginBottom={SPACING.spacing3}
          >
            {t('software_update_modal_remind_me_later_button')}
          </SecondaryButton>
          <PrimaryButton onClick={() => {}} disabled={currentRunId != null}>
            {t('software_update_modal_update_button')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
