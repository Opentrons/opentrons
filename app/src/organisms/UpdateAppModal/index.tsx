import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styled, { css } from 'styled-components'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
  Flex,
  NewPrimaryBtn,
  NewSecondaryBtn,
  BORDERS,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_AROUND,
} from '@opentrons/components'

import {
  getShellUpdateState,
  getAvailableShellUpdate,
  downloadShellUpdate,
  applyShellUpdate,
} from '../../redux/shell'

import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { ReleaseNotes } from '../../molecules/ReleaseNotes'
import { LegacyModal } from '../../molecules/LegacyModal'
import { Banner } from '../../atoms/Banner'
import { ProgressBar } from '../../atoms/ProgressBar'
import { useRemoveActiveAppUpdateToast } from '../Alerts'

import type { Dispatch } from '../../redux/types'
import { StyledText } from '../../atoms/text'

interface PlaceHolderErrorProps {
  errorMessage?: string
}

const PlaceholderError = ({
  errorMessage,
}: PlaceHolderErrorProps): JSX.Element => {
  const SOMETHING_WENT_WRONG = 'Something went wrong while updating your app.'
  const AN_UNKNOWN_ERROR_OCCURRED = 'An unknown error occurred.'
  const FALLBACK_ERROR_MESSAGE = `If you keep getting this message, try restarting your app and/or
  robot. If this does not resolve the issue please contact Opentrons
  Support.`

  return (
    <>
      {SOMETHING_WENT_WRONG}
      <br />
      <br />
      {errorMessage ?? AN_UNKNOWN_ERROR_OCCURRED}
      <br />
      <br />
      {FALLBACK_ERROR_MESSAGE}
    </>
  )
}
export const RELEASE_NOTES_URL_BASE =
  'https://github.com/Opentrons/opentrons/releases/tag/v'
const UPDATE_ERROR = 'Update Error'
const FOOTER_BUTTON_STYLE = css`
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
const UpdateAppBanner = styled(Banner)`
  border: none;
`
const UPDATE_PROGRESS_BAR_STYLE = css`
  margin-top: ${SPACING.spacing24};
  border-radius: ${BORDERS.borderRadiusSize3};
  background: ${COLORS.medGreyEnabled};
  width: 17.12rem;
`
const LEGACY_MODAL_STYLE = css`
  width: 40rem;
  textalign: center;
`

const RESTART_APP_AFTER_TIME = 5000

export interface UpdateAppModalProps {
  closeModal: (arg0: boolean) => void
}

export function UpdateAppModal(props: UpdateAppModalProps): JSX.Element {
  const { closeModal } = props
  const dispatch = useDispatch<Dispatch>()
  const updateState = useSelector(getShellUpdateState)
  const {
    downloaded,
    downloading,
    downloadPercentage,
    error,
    info: updateInfo,
  } = updateState
  const releaseNotes = updateInfo?.releaseNotes
  const { t } = useTranslation('app_settings')
  const history = useHistory()
  const { removeActiveAppUpdateToast } = useRemoveActiveAppUpdateToast()
  const availableAppUpdateVersion = useSelector(getAvailableShellUpdate) ?? ''

  if (downloaded)
    setTimeout(() => dispatch(applyShellUpdate()), RESTART_APP_AFTER_TIME)

  const handleRemindMeLaterClick = (): void => {
    history.push('/app-settings/general')
    closeModal(true)
  }

  removeActiveAppUpdateToast()

  const appUpdateFooter = (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <ExternalLink
        href={`${RELEASE_NOTES_URL_BASE}${availableAppUpdateVersion}`}
        css={css`
          font-size: 0.875rem;
        `}
        id="SoftwareUpdateReleaseNotesLink"
        marginLeft={SPACING.spacing32}
      >
        {t('release_notes')}
      </ExternalLink>
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_AROUND}>
        <NewSecondaryBtn
          onClick={handleRemindMeLaterClick}
          marginRight={SPACING.spacing8}
          css={FOOTER_BUTTON_STYLE}
        >
          {t('remind_later')}
        </NewSecondaryBtn>
        <NewPrimaryBtn
          onClick={() => dispatch(downloadShellUpdate())}
          marginRight={SPACING.spacing12}
          css={FOOTER_BUTTON_STYLE}
        >
          {t('update_app_now')}
        </NewPrimaryBtn>
      </Flex>
    </Flex>
  )

  return (
    <>
      {error != null ? (
        <LegacyModal
          title={UPDATE_ERROR}
          onClose={() => closeModal(true)}
          css={LEGACY_MODAL_STYLE}
        >
          <PlaceholderError errorMessage={error.message} />
        </LegacyModal>
      ) : null}
      {(downloading || downloaded) && error == null ? (
        <LegacyModal title={t('opentrons_app_update')} css={LEGACY_MODAL_STYLE}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_CENTER}
            padding={SPACING.spacing48}
          >
            <StyledText>
              {downloading ? t('download_update') : t('restarting_app')}
            </StyledText>
            <ProgressBar
              percentComplete={downloadPercentage}
              outerStyles={UPDATE_PROGRESS_BAR_STYLE}
            />
          </Flex>
        </LegacyModal>
      ) : null}
      {!downloading && !downloaded && error == null ? (
        <LegacyModal
          title={t('opentrons_app_update_available')}
          onClose={() => closeModal(true)}
          closeOnOutsideClick={true}
          footer={appUpdateFooter}
          maxHeight="80%"
          css={LEGACY_MODAL_STYLE}
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <UpdateAppBanner type="informing" marginBottom={SPACING.spacing8}>
              {t('update_requires_restarting')}
            </UpdateAppBanner>
            <ReleaseNotes source={releaseNotes} />
          </Flex>
        </LegacyModal>
      ) : null}
    </>
  )
}
