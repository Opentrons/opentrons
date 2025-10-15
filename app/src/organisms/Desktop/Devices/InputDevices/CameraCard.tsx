import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  Chip,
  Divider,
  MenuItem,
  OverflowBtn,
  StyledText,
  useMenuHandleClickOutside,
  useOnClickOutside,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import systemCameraFlex from '/app/assets/images/system_camera_flex.png'
import systemCameraOT2 from '/app/assets/images/system_camera_ot2.png'
import { CameraControls } from '/app/organisms/Desktop/Camera/CameraControls'
import { useCurrentRunId, useNotifyRunQuery } from '/app/resources/runs'

import styles from './inputdevices.module.css'

const RUN_REFETCH_INTERVAL_MS = 5000

export interface CameraCardProps {
  isFlex: boolean
  robotName: string
}

export function CameraCard({
  isFlex,
  robotName,
}: CameraCardProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const { handleOverflowClick, showOverflowMenu, setShowOverflowMenu } =
    useMenuHandleClickOutside()
  const [isStubbedEnabled, setStubbedEnabled] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const navigate = useNavigate()

  const buildImageSrc = (): string => {
    return isFlex ? systemCameraFlex : systemCameraOT2
  }

  const runId = useCurrentRunId()
  const run = useNotifyRunQuery(runId, {
    refetchInterval: RUN_REFETCH_INTERVAL_MS,
  })

  // TODO (jh, 09-26-25): This disabled check will eventually be replaced with
  //  "have settings been confirmed during run setup" logic.
  const doesRunExist = runId != null
  const isRunIdle = run?.data?.data.status === RUN_STATUS_IDLE

  const cardOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })

  const toggleCameraEnabled = (): void => {
    setStubbedEnabled(!isStubbedEnabled)
  }

  const toggleControls = (): void => {
    setShowControls(!showControls)
  }

  const navigateToUsageSettings = (): void => {
    navigate(`/devices/${robotName}/robot-settings/camera`)
  }

  return (
    <div className={styles.card_container}>
      <div className={styles.card_content_container}>
        <div>
          <img src={buildImageSrc()} alt={t('camera')} />
        </div>
        <div className={styles.card_content_text_container}>
          <div className={styles.card_text_name_location}>
            <StyledText
              className={styles.card_on_deck_text}
              desktopStyle="bodyDefaultRegular"
            >
              {t('on_deck')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('camera')}
            </StyledText>
          </div>
          {isStubbedEnabled ? (
            <Chip type="success" hasIcon={false} text={t('enabled')} />
          ) : (
            <Chip type="neutral" hasIcon={false} text={t('disabled')} />
          )}
        </div>
      </div>
      <div className={styles.card_overflow_btn}>
        <OverflowBtn
          aria-label="overflow"
          onClick={handleOverflowClick}
          disabled={doesRunExist && !isRunIdle}
        />
      </div>
      {showOverflowMenu && (
        <>
          <div
            ref={cardOverflowWrapperRef}
            onClick={() => {
              setShowOverflowMenu(false)
            }}
          >
            <CameraCardOverflowMenu
              cameraEnabled={isStubbedEnabled}
              toggleCameraEnabled={toggleCameraEnabled}
              toggleControls={toggleControls}
              navigateToUsageSettings={navigateToUsageSettings}
            />
          </div>
        </>
      )}
      {showControls &&
        createPortal(
          <CameraControls onClose={toggleControls} />,
          getTopPortalEl()
        )}
    </div>
  )
}

function CameraCardOverflowMenu({
  cameraEnabled,
  toggleCameraEnabled,
  toggleControls,
  navigateToUsageSettings,
}: {
  cameraEnabled: boolean
  toggleCameraEnabled: () => void
  toggleControls: () => void
  navigateToUsageSettings: () => void
}): JSX.Element {
  const { t } = useTranslation('device_details')

  return (
    <div className={styles.card_overflow_menu_container}>
      <div className={styles.card_overflow_menu_content_container}>
        <MenuItem onClick={toggleCameraEnabled}>
          {cameraEnabled ? t('disable_camera') : t('enable_camera')}
        </MenuItem>
        <MenuItem onClick={toggleControls}>{t('edit_settings')}</MenuItem>
        <Divider />
        <MenuItem onClick={navigateToUsageSettings}>
          {t('usage_settings')}
        </MenuItem>
      </div>
    </div>
  )
}
