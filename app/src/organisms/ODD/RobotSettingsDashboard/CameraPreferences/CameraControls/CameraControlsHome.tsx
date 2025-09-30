import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon, ListButton, StyledText } from '@opentrons/components'

import { MediumButton } from '/app/atoms/buttons'
// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import { useStubPreviewImage } from '/app/organisms/Desktop/Camera/CameraControls/PreviewSettings/hooks/useStubPreviewImage'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { ImagePreviewModal } from '/app/organisms/ODD/RobotSettingsDashboard/CameraPreferences/CameraControls/ImagePreviewModal'

import styles from '../preferences.module.css'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import type { UseStubCameraSettingsValuesResult } from '/app/organisms/Desktop/Camera/CameraControls/hooks/useStubCameraSettingsValues'
import type { ActiveControlView } from '.'

export interface CameraControlsHomeProps {
  setActiveSubView: (view: ActiveControlView) => void
  toggleShowControls: () => void
  settings: UseStubCameraSettingsValuesResult
}

export function CameraControlsHome({
  setActiveSubView,
  toggleShowControls,
  settings,
}: CameraControlsHomeProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { isLoading, imgPath, takePhoto } = useStubPreviewImage()

  const [showModal, setShowModal] = useState(false)

  const toggleModal = (): void => {
    setShowModal(!showModal)
  }
  const onTakePhoto = (): void => {
    if (!isLoading) {
      takePhoto()
      setShowModal(true)
    }
  }

  const buildZoomText = (): string => {
    switch (settings.zoom) {
      case '1x':
        return t('default_zoom')
      case '1.5x':
        return t('moderate_zoom')
      case '2x':
        return t('maximum_zoom')
    }
  }

  return (
    <div className={styles.container}>
      {showModal && imgPath != null && (
        <ImagePreviewModal imgPath={imgPath} toggleModal={toggleModal} />
      )}
      <ChildNavigation
        header={t('image_video_settings_lc')}
        onClickBack={toggleShowControls}
        onClickButton={onTakePhoto}
        buttonText={t('preview_image')}
        iconName={isLoading && imgPath == null ? 'ot-spinner' : undefined}
        iconPlacement="startIcon"
      />
      <div className={styles.control_content_container}>
        <div className={styles.control_btn_container}>
          <SettingButton
            onClick={() => {
              setActiveSubView('zoom')
            }}
            title={t('zoom')}
            value={buildZoomText()}
          />
          <SettingButton
            onClick={() => {
              setActiveSubView('brightness')
            }}
            title={t('brightness')}
            value={t('value_percent', { value: settings.brightness })}
          />
          <SettingButton
            onClick={() => {
              setActiveSubView('contrast')
            }}
            title={t('contrast')}
            value={t('value_percent', { value: settings.contrast })}
          />
          <SettingButton
            onClick={() => {
              setActiveSubView('saturation')
            }}
            title={t('saturation')}
            value={t('value_percent', { value: settings.saturation })}
          />
        </div>
        <MediumButton
          buttonType="alert"
          buttonText={t('reset_settings_to_default')}
          onClick={settings.restoreToDefault}
        />
      </div>
    </div>
  )
}

interface SettingButtonProps {
  onClick: () => void
  title: string
  value: string
}

function SettingButton({
  onClick,
  title,
  value,
}: SettingButtonProps): JSX.Element {
  return (
    <ListButton
      type="noActive"
      className={styles.setting_card}
      onClick={onClick}
    >
      <div className={styles.control_text_container}>
        <StyledText oddStyle="level4HeaderSemiBold">{title}</StyledText>
        <StyledText
          className={styles.usage_subtext}
          oddStyle="level4HeaderRegular"
        >
          {value}
        </StyledText>
      </div>
      <Icon name="more" size="3rem" />
    </ListButton>
  )
}
