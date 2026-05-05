import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  BasicButton,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  INFO_TOAST,
  JUSTIFY_CENTER,
  LargeButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { getEnableFork } from '/protocol-designer/feature-flags/selectors'

import { getHasOptedIn } from '../../analytics/selectors'
import { EndUserAgreementFooter } from '../../components/molecules'
import { AnnouncementModal } from '../../components/organisms'
import { useAnnouncements } from '../../components/organisms/AnnouncementModal/announcements'
import { useKitchen } from '../../components/organisms/Kitchen/useKitchen'
import { ACCEPTED_PROTOCOL_FILE_TYPES } from '../../constants'
import { getFileMetadata } from '../../file-data/selectors'
import { actions as loadFileActions } from '../../load-file'
import { toggleNewProtocolModal } from '../../navigation/actions'
import { getIsProduction } from '../../networking/opentronsWebApi'
import {
  getLocalStorageItem,
  localStorageAnnouncementKey,
  setLocalStorageItem,
} from '../../persist'
import styles from './landing.module.css'

import type { ChangeEvent } from 'react'
import type { ThunkDispatch } from '../../types'

import welcomeImage from '../../assets/images/welcome_page.png'

const OT2_APP_PROD_URL = 'https://ot2.designer.opentrons.com/#/createNew'
// ToDo activate this when the sandbox is ready.
// const OT2_APP_STAGE_URL = 'sandbox url'

// The type will be changed only string when the sandbox is ready
const getOt2DesignerCreateUrl = (): string | null => {
  if (getIsProduction()) {
    return OT2_APP_PROD_URL
  }
  return null
}

export function Landing(): JSX.Element {
  const { t } = useTranslation('shared')
  const dispatch: ThunkDispatch<any> = useDispatch()
  const metadata = useSelector(getFileMetadata)
  const navigate = useNavigate()
  const [showAnnouncementModal, setShowAnnouncementModal] =
    useState<boolean>(false)
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

  const enableFork = useSelector(getEnableFork)

  useEffect(
    () => {
      if (
        userHasNotSeenAnnouncement &&
        appVersion != null &&
        hasOptedIn != null
      ) {
        const toastId = bakeToast(
          t('learn_more', { version: _OT_PD_VERSION_ }) as string,
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
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userHasNotSeenAnnouncement, appVersion, hasOptedIn]
  )

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

  const openOt2DesignerInNewTab = (): void => {
    const redirectTarget = getOt2DesignerCreateUrl()
    if (redirectTarget !== null) {
      window.open(redirectTarget, '_blank', 'noopener,noreferrer')
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
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing16}
          alignItems={ALIGN_CENTER}
        >
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
            <StyledText desktopStyle="headingLargeBold" as="h1">
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
        <div className={styles.button_container}>
          <NavLink to="/createNew" className={styles.nav_link}>
            <LargeButton
              onClick={() => {
                dispatch(toggleNewProtocolModal(true))
              }}
              buttonText={
                <span className={styles.button_text}>
                  {t('create_a_flex_protocol')}
                </span>
              }
            />
          </NavLink>
          {enableFork ? (
            <LargeButton
              buttonType="blueStroke"
              onClick={openOt2DesignerInNewTab}
              buttonText={
                <span className={styles.button_text}>
                  {t('create_a_ot2_protocol')}
                </span>
              }
            />
          ) : null}
        </div>
        <label className={styles.label}>
          <BasicButton onClick={handleImportClick} underLine>
            {t('import_existing_protocol')}
          </BasicButton>
          <input
            type="file"
            onChange={loadFile}
            ref={fileInputRef}
            aria-label={`${t('import')}_from_landing`}
            className={styles.hiddenInput}
            accept={ACCEPTED_PROTOCOL_FILE_TYPES}
          />
        </label>
      </Flex>
      <EndUserAgreementFooter />
    </>
  )
}
