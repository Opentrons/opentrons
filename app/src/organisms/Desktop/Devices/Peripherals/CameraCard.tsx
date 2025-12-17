import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  Chip,
  Divider,
  Flex,
  Icon,
  MenuItem,
  OverflowBtn,
  StyledText,
  useMenuHandleClickOutside,
  useOnClickOutside,
} from '@opentrons/components'
import { useCreateCameraImageSettings } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import systemCameraFlex from '/app/assets/images/system_camera_flex.png'
import systemCameraOT2 from '/app/assets/images/system_camera_ot2.png'
import { useCameraUsageSettings } from '/app/local-resources/images/hooks/useCameraUsageSettings'
import { CameraControls } from '/app/organisms/Desktop/Camera/CameraControls'
import {
  SOURCE_ROBOT_SETTINGS,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { useRobotType } from '/app/redux-resources/robots'
import { useFeatureFlag } from '/app/redux/config'

import styles from './inputdevices.module.css'

export interface CameraCardProps {
  isFlex: boolean
  robotName: string
  isRobotBusy: boolean
}

export function CameraCard({
  isFlex,
  robotName,
  isRobotBusy,
}: CameraCardProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const { handleOverflowClick, showOverflowMenu, setShowOverflowMenu } =
    useMenuHandleClickOutside()
  const [showControls, setShowControls] = useState(false)
  const navigate = useNavigate()

  const buildImageSrc = (): string => {
    return isFlex ? systemCameraFlex : systemCameraOT2
  }

  const robotType = useRobotType(robotName)

  const cardOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })

  const {
    isCameraEnabled,
    toggleCameraEnabled,
    isLiveVideoEnabled,
    isRecoveryCaptureEnabled,
  } = useCameraUsageSettings()

  const toggleControls = (): void => {
    setShowControls(!showControls)
  }

  const { reportCameraEnablementSettings } = useCameraAnalytics({
    source: SOURCE_ROBOT_SETTINGS,
    robotType,
  })
  const handleToggleCamera = (): void => {
    toggleCameraEnabled()
    reportCameraEnablementSettings({
      cameraEnabled: !isCameraEnabled,
      liveFeedEnabled: isLiveVideoEnabled,
      recoveryCaptureEnabled: isRecoveryCaptureEnabled,
    })
  }
  const navigateToUsageSettings = (): void => {
    navigate(`/devices/${robotName}/robot-settings/camera`)
  }
  const { createCameraImageSettings } = useCreateCameraImageSettings()

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
            <div className={styles.card_photo_content_container}>
              <Icon className={styles.icon_container} name="camera" />
              <StyledText desktopStyle="bodyDefaultRegular">
                {isFlex ? t('branded:flex_camera') : t('ot2_camera')}
              </StyledText>
            </div>
          </div>
          <Flex width="fit-content">
            <Chip
              type={isCameraEnabled ? 'success' : 'neutral'}
              hasIcon={false}
              text={isCameraEnabled ? t('enabled') : t('disabled')}
              chipSize="small"
            />
          </Flex>
        </div>
      </div>
      <div className={styles.card_overflow_btn}>
        <OverflowBtn
          aria-label="overflow"
          onClick={handleOverflowClick}
          disabled={isRobotBusy}
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
            handleToggleCamera={handleToggleCamera}
            toggleControls={toggleControls}
            navigateToUsageSettings={navigateToUsageSettings}
          />
        </div>
      )}
      {showControls &&
        createPortal(
          <CameraControls
            onClose={toggleControls}
            postCameraImageSettings={createCameraImageSettings}
          />,
          getTopPortalEl()
        )}
    </div>
  )
}

function CameraCardOverflowMenu({
  cameraEnabled,
  handleToggleCamera,
  toggleControls,
  navigateToUsageSettings,
}: {
  cameraEnabled: boolean
  handleToggleCamera: () => void
  toggleControls: () => void
  navigateToUsageSettings: () => void
}): JSX.Element {
  const { t } = useTranslation('device_details')
  const cameraControlsEnabled = useFeatureFlag('camera')

  return (
    <div className={styles.card_overflow_menu_container}>
      <div className={styles.card_overflow_menu_content_container}>
        <MenuItem onClick={handleToggleCamera}>
          {cameraEnabled ? t('disable_camera') : t('enable_camera')}
        </MenuItem>
        {cameraControlsEnabled && (
          <MenuItem onClick={toggleControls}>{t('edit_settings')}</MenuItem>
        )}
        <Divider />
        <MenuItem onClick={navigateToUsageSettings}>
          {t('usage_settings')}
        </MenuItem>
      </div>
    </div>
  )
}
