import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

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
import { useCameraUsageSettings } from '/app/local-resources/images/hooks/useCameraUsageSettings'
import { CameraControls } from '/app/organisms/Desktop/Camera/CameraControls'
import { useCurrentRunId } from '/app/resources/runs'

import styles from './inputdevices.module.css'

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
  const [showControls, setShowControls] = useState(false)
  const navigate = useNavigate()

  const buildImageSrc = (): string => {
    return isFlex ? systemCameraFlex : systemCameraOT2
  }

  const runId = useCurrentRunId()

  const doesRunExist = runId != null

  const cardOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })

  const { isCameraEnabled, toggleCameraEnabled } = useCameraUsageSettings()

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
          {isCameraEnabled ? (
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
          disabled={doesRunExist}
        />
      </div>
      {showOverflowMenu && (
        <div
          ref={cardOverflowWrapperRef}
          onClick={() => {
            setShowOverflowMenu(false)
          }}
        >
          <CameraCardOverflowMenu
            cameraEnabled={isCameraEnabled}
            toggleCameraEnabled={toggleCameraEnabled}
            toggleControls={toggleControls}
            navigateToUsageSettings={navigateToUsageSettings}
          />
        </div>
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
