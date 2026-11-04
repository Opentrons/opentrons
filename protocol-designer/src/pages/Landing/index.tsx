import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink, useNavigate } from 'react-router-dom'

import {
  BasicButton,
  COLORS,
  INFO_TOAST,
  JUSTIFY_CENTER,
  LargeButton,
  StyledText,
} from '@opentrons/components'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { getOt2DesignerCreateUrl } from '/protocol-designer/utils/getOt2DesignerCreateUrl'

import { getHasOptedIn } from '../../analytics/selectors'
import { EndUserAgreementFooter } from '../../components/molecules'
import { AnnouncementModal, Ot2ProtocolModal } from '../../components/organisms'
import { useAnnouncements } from '../../components/organisms/AnnouncementModal/announcements'
import { useKitchen } from '../../components/organisms/Kitchen/useKitchen'
import { ACCEPTED_PROTOCOL_FILE_TYPES } from '../../constants'
import { getFileMetadata, getRobotType } from '../../file-data/selectors'
import { actions as loadFileActions } from '../../load-file'
import { toggleNewProtocolModal } from '../../navigation/actions'
import {
  getLocalStorageItem,
  localStorageAnnouncementKey,
  setLocalStorageItem,
} from '../../persist'
import styles from './landing.module.css'

import type { ChangeEvent, ReactNode } from 'react'
import type { ThunkDispatch } from '../../types'

import welcomeImage from '../../assets/images/welcome_page.png'

export function Landing(): ReactNode {
  const { t } = useTranslation('shared')
  const dispatch: ThunkDispatch<any> = useDispatch()
  const metadata = useSelector(getFileMetadata)
  const robotType = useSelector(getRobotType)
  const navigate = useNavigate()
  const [showAnnouncementModal, setShowAnnouncementModal] =
    useState<boolean>(false)
  const [showOt2Modal, setShowOt2Modal] = useState<boolean>(false)
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
      if (robotType === OT2_ROBOT_TYPE) {
        setShowOt2Modal(true)
        dispatch(loadFileActions.undoLoadFile())
      } else {
        console.warn('protocol already exists, navigating to overview')
        navigate('/overview')
      }
    }
  }, [metadata, navigate, robotType, dispatch])

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
    window.open(redirectTarget, '_blank', 'noopener')
  }

  const handleOpenOt2Designer = (): void => {
    openOt2DesignerInNewTab()
    setShowOt2Modal(false)
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
      {showOt2Modal ? (
        <Ot2ProtocolModal
          onClose={() => {
            setShowOt2Modal(false)
          }}
          onOpenOt2Designer={handleOpenOt2Designer}
        />
      ) : null}
      <div data-cy="landing-page" className={styles.content_container}>
        <div className={styles.image_container}>
          <img
            src={welcomeImage}
            height="132px"
            width="548px"
            aria-label="welcome image"
          />
          <div className={styles.text_container}>
            <StyledText desktopStyle="headingLargeBold" as="h1">
              {t('welcome')}
            </StyledText>
            <StyledText
              desktopStyle="headingSmallRegular"
              color={COLORS.grey60}
              maxWidth="34.25rem"
            >
              {t('no-code-required')}
            </StyledText>
          </div>
        </div>
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
          <LargeButton
            buttonType="blueStroke"
            onClick={openOt2DesignerInNewTab}
            buttonText={
              <span className={styles.button_text}>
                {t('create_a_ot2_protocol')}
              </span>
            }
          />
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
      </div>
      <EndUserAgreementFooter />
    </>
  )
}
