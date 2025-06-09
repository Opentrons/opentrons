import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  BasicButton,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Flex,
  INFO_TOAST,
  JUSTIFY_CENTER,
  LargeButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getHasOptedIn } from '../../analytics/selectors'
import { EndUserAgreementFooter } from '../../components/molecules'
import { AnnouncementModal } from '../../components/organisms'
import { useAnnouncements } from '../../components/organisms/AnnouncementModal/announcements'
import { useKitchen } from '../../components/organisms/Kitchen/hooks'
import { getFileMetadata } from '../../file-data/selectors'
import { actions as loadFileActions } from '../../load-file'
import { toggleNewProtocolModal } from '../../navigation/actions'
import {
  getLocalStorageItem,
  localStorageAnnouncementKey,
  setLocalStorageItem,
} from '../../persist'

import type { ChangeEvent, ComponentProps } from 'react'
import type { ThunkDispatch } from '../../types'

import welcomeImage from '../../assets/images/welcome_page.png'

export function Landing(): JSX.Element {
  const { t } = useTranslation('shared')
  const dispatch: ThunkDispatch<any> = useDispatch()
  const metadata = useSelector(getFileMetadata)
  const navigate = useNavigate()
  const [showAnnouncementModal, setShowAnnouncementModal] = useState<boolean>(
    false
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { hasOptedIn, appVersion } = useSelector(getHasOptedIn)
  const { bakeToast, eatToast } = useKitchen()
  const announcements = useAnnouncements()
  const lastAnnouncement = announcements[announcements.length - 1]
  const announcementKey = lastAnnouncement
    ? lastAnnouncement.announcementKey
    : null

  const userHasNotSeenAnnouncement =
    getLocalStorageItem(localStorageAnnouncementKey) !== announcementKey &&
    hasOptedIn != null

  useEffect(() => {
    if (
      userHasNotSeenAnnouncement &&
      appVersion != null &&
      hasOptedIn != null
    ) {
      const toastId = bakeToast(
        t('learn_more', { version: process.env.OT_PD_VERSION }) as string,
        INFO_TOAST,
        {
          heading: t('updated_protocol_designer'),
          closeButton: true,
          linkText: t('view_release_notes'),
          onClose: () => {
            setLocalStorageItem(localStorageAnnouncementKey, announcementKey)
          },
          onLinkClick: () => {
            eatToast(toastId)
            setShowAnnouncementModal(true)
          },
          disableTimeout: true,
          justifyContent: JUSTIFY_CENTER,
        }
      )
    }
  }, [userHasNotSeenAnnouncement, appVersion, hasOptedIn])

  useEffect(() => {
    if (metadata?.created != null) {
      console.warn('protocol already exists, navigating to overview')
      navigate('/overview')
    }
  }, [metadata, navigate])

  const loadFile = (fileChangeEvent: ChangeEvent<HTMLInputElement>): void => {
    dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
  }

  const handleImportClick = (): void => {
    if (fileInputRef.current != null) {
      fileInputRef.current.click()
    }
  }

  return (
    <>
      {showAnnouncementModal ? (
        <AnnouncementModal
          isViewReleaseNotes={showAnnouncementModal}
          onClose={() => {
            setShowAnnouncementModal(false)
          }}
        />
      ) : null}
      <Flex
        data-cy="landing-page"
        backgroundColor={COLORS.grey10}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        height="calc(100vh - 9rem)"
        width="100%"
        gridGap={SPACING.spacing32}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <img
            src={welcomeImage}
            height="132px"
            width="548px"
            aria-label="welcome image"
          />
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            alignItems={ALIGN_CENTER}
          >
            <StyledText desktopStyle="headingLargeBold">
              {t('welcome')}
            </StyledText>
            <StyledText
              desktopStyle="headingSmallRegular"
              color={COLORS.grey60}
              maxWidth="34.25rem"
              textAlign={TYPOGRAPHY.textAlignCenter}
            >
              {t('no-code-required')}
            </StyledText>
          </Flex>
        </Flex>
        <StyledNavLink to="/createNew">
          <LargeButton
            onClick={() => {
              dispatch(toggleNewProtocolModal(true))
            }}
            buttonText={<ButtonText>{t('create_a_protocol')}</ButtonText>}
          />
        </StyledNavLink>
        <StyledLabel>
          <BasicButton onClick={handleImportClick} underLine>
            {t('import_existing_protocol')}
          </BasicButton>
          <button
            onClick={() => {
              throw new Error('This is your first error!')
            }}
          >
            Break the world
          </button>
          ;
          <StyledInput
            type="file"
            onChange={loadFile}
            ref={fileInputRef}
            aria-label={t('import')}
          />
        </StyledLabel>
      </Flex>
      <EndUserAgreementFooter />
    </>
  )
}

const StyledLabel = styled.label`
  display: inline-block;
  cursor: ${CURSOR_POINTER};
  input[type='file'] {
    display: none;
  }
`

const ButtonText = styled.span`
  line-height: ${TYPOGRAPHY.lineHeight24};
  font-size: 1rem;
  font-style: normal;
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
`

const StyledNavLink = styled(NavLink)<ComponentProps<typeof NavLink>>`
  color: ${COLORS.white};
  text-decoration: none;
`

const StyledInput = styled.input`
  display: none;
`
