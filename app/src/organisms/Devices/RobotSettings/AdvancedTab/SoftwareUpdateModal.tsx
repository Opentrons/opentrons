import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  TYPOGRAPHY,
  SPACING,
  PrimaryButton,
  SecondaryButton,
} from '@opentrons/components'
import { getShellUpdateState } from '../../../../redux/shell'
import { useCurrentRunId } from '../../../../organisms/ProtocolUpload/hooks'
// import { ReleaseNotes } from '../../../../molecules/ReleaseNotes'

import { StyledText } from '../../../../atoms/text'
import { ExternalLink } from '../../../../atoms/Link/ExternalLink'
import { Banner } from '../../../../atoms/Banner'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { CONNECTABLE, REACHABLE } from '../../../../redux/discovery'
import { Divider } from '../../../../atoms/structure'
import { useRobot } from '../../hooks'
import { UpdateBuildroot } from '../UpdateBuildroot'

const TECHNICAL_CHANGE_LOG_URL =
  'https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md'
const ISSUE_TRACKER_URL =
  'https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug'
const RELEASE_NOTES_URL = 'https://github.com/Opentrons/opentrons/releases'

interface SoftwareUpdateModalProps {
  robotName: string
  closeModal: () => void
}

export function SoftwareUpdateModal({
  robotName,
  closeModal,
}: SoftwareUpdateModalProps): JSX.Element | null {
  const { t } = useTranslation('device_settings')

  const currentRunId = useCurrentRunId()
  // ToDo: Add release notes for the new design
  const updateState = useSelector(getShellUpdateState)
  //   const { downloaded, downloading, error, info: updateInfo } = updateState
  const { info: updateInfo } = updateState
  const version = updateInfo?.version ?? ''
  //   const releaseNotes = updateInfo?.releaseNotes
  const [showUpdateModal, setShowUpdateModal] = React.useState<boolean>(false)
  const robot = useRobot(robotName)

  const handleCloseModal = (): void => {
    setShowUpdateModal(false)
    closeModal()
  }

  const handleLaunchUpdateModal: React.MouseEventHandler = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowUpdateModal(true)
  }

  if (robot?.status !== CONNECTABLE && robot?.status !== REACHABLE) return null

  return showUpdateModal ? (
    <UpdateBuildroot robot={robot} close={handleCloseModal} />
  ) : (
    <LegacyModal title={t('robot_update_available')} onClose={closeModal}>
      <Banner type="informing">{t('requires_restarting_the_robot')}</Banner>
      <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing16}>
        {/* <ReleaseNotes source={releaseNotes} /> ToDo: align with new design */}
        <StyledText css={TYPOGRAPHY.pSemiBold}>
          {t('app_change_in', { version })}
        </StyledText>
        <StyledText as="p">
          {'None in the Opentrons (Here will be change logs)'}
        </StyledText>
        <StyledText css={TYPOGRAPHY.pSemiBold} marginTop={SPACING.spacing8}>
          {t('new_features')}
        </StyledText>
        <StyledText as="p">
          {'None in the Opentrons (Here will be features info)'}
        </StyledText>
        <StyledText css={TYPOGRAPHY.pSemiBold} marginTop={SPACING.spacing8}>
          {t('bug_fixes')}
        </StyledText>
        <StyledText as="p" marginBottom={SPACING.spacing16}>
          {'None in the Opentrons (Here will be fixes info)'}
        </StyledText>
        <Divider />
        <ExternalLink
          href={TECHNICAL_CHANGE_LOG_URL}
          css={TYPOGRAPHY.pSemiBold}
          id="SoftwareUpdateTechnicalChangeLogLink"
          marginTop={SPACING.spacing16}
          marginBottom={SPACING.spacing8}
        >
          {t('view_opentrons_technical_change_log')}
        </ExternalLink>
        <ExternalLink
          href={ISSUE_TRACKER_URL}
          css={TYPOGRAPHY.pSemiBold}
          id="SoftwareUpdateIssueTrackerLink"
          marginBottom={SPACING.spacing8}
        >
          {t('view_opentrons_issue_tracker')}
        </ExternalLink>
        <ExternalLink
          href={RELEASE_NOTES_URL}
          css={TYPOGRAPHY.pSemiBold}
          id="SoftwareUpdateReleaseNotesLink"
          marginBottom={SPACING.spacing8}
        >
          {t('view_opentrons_release_notes')}
        </ExternalLink>
        <Flex justifyContent={JUSTIFY_FLEX_END}>
          <SecondaryButton onClick={closeModal} marginRight={SPACING.spacing8}>
            {t('remind_me_later')}
          </SecondaryButton>
          <PrimaryButton
            onClick={handleLaunchUpdateModal}
            disabled={currentRunId != null}
          >
            {t('update_robot_now')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}
