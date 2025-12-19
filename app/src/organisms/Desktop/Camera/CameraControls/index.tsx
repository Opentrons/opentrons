import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Icon,
  Modal,
  PrimaryButton,
  SecondaryButton,
  Slider,
} from '@opentrons/components'

import { TextOnlyButton } from '/app/atoms/buttons'
import { Divider } from '/app/atoms/structure'
import { useCameraSettingsValues } from '/app/local-resources/images/hooks/useCameraSettingsValues'

import styles from './cameracontrols.module.css'
import { PreviewSettings } from './PreviewSettings'
import { ZoomSettings } from './ZoomSettings'

import type { AxiosError } from 'axios'
import type { UseMutateFunction } from 'react-query'
import type {
  CameraImageSettings,
  CameraImageSettingsResponse,
} from '@opentrons/api-client'
import type { UseCameraSettingsValuesResult } from '/app/local-resources/images/hooks/useCameraSettingsValues'

export interface CameraControlsProps {
  onClose: () => void
  postCameraImageSettings: UseMutateFunction<
    CameraImageSettingsResponse,
    AxiosError,
    CameraImageSettings
  >
}

export function CameraControls({
  onClose,
  postCameraImageSettings,
}: CameraControlsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const settings = useCameraSettingsValues()
  const [isLoading, setIsLoading] = useState(false)
  const handleSave = (): void => {
    setIsLoading(true)
    postCameraImageSettings(
      {
        zoom: settings.zoom,
        brightness: settings.brightness,
        contrast: settings.contrast,
        saturation: settings.saturation,
      },
      {
        onSuccess: () => {
          onClose()
        },
        onSettled: () => {
          setIsLoading(false)
        },
      }
    )
  }

  return (
    <Modal onClose={onClose} title={t('camera_controls')} width="46rem">
      <div className={styles.container}>
        <div className={styles.content_container}>
          <CameraControlSettings settings={settings} />
          <PreviewSettings
            zoom={settings.zoom}
            brightness={settings.brightness}
            contrast={settings.contrast}
            saturation={settings.saturation}
          />
        </div>
        <div className={styles.footer_container}>
          <TextOnlyButton
            onClick={settings.restoreToDefault}
            buttonText={t('restore_to_default')}
          />
          <div className={styles.buttons}>
            <SecondaryButton onClick={onClose}>{t('Cancel')}</SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={isLoading}>
              <div className={styles.save_button}>
                {isLoading && <Icon name="ot-spinner" spin size="1rem" />}
                {t('save')}
              </div>
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Modal>
  )
}

interface CameraControlSettingsProps {
  settings: UseCameraSettingsValuesResult
}

function CameraControlSettings({
  settings,
}: CameraControlSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.settings_container}>
      <ZoomSettings zoom={settings.zoom} adjustZoom={settings.adjustZoom} />
      <Divider />
      <Slider
        title={t('brightness')}
        subtext={t('adjust_brightness')}
        adjustValue={settings.adjustBrightness}
        value={settings.brightness}
      />
      <Divider />
      <Slider
        title={t('contrast')}
        subtext={t('adjust_contrast')}
        adjustValue={settings.adjustContrast}
        value={settings.contrast}
      />
      <Divider />
      <Slider
        title={t('saturation')}
        subtext={t('adjust_saturation')}
        adjustValue={settings.adjustSaturation}
        value={settings.saturation}
      />
    </div>
  )
}
