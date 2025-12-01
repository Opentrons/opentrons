import { useTranslation } from 'react-i18next'

import { Modal, PrimaryButton, Slider } from '@opentrons/components'
import { useUpdateCameraImageSettings } from '@opentrons/react-api-client'

import { TextOnlyButton } from '/app/atoms/buttons'
import { Divider } from '/app/atoms/structure'

import styles from './cameracontrols.module.css'
import { useCameraSettingsValues } from './hooks/useCameraSettingsValues'
import { PreviewSettings } from './PreviewSettings'
import { ZoomSettings } from './ZoomSettings'

import type { UseCameraSettingsValuesResult } from './hooks/useCameraSettingsValues'

function zoomStringToNumber(value: string): number {
  return Number(value.replace(/x/i, ''))
}

export interface CameraControlsProps {
  onClose: () => void
}
const { updateCameraImageSettings } = useUpdateCameraImageSettings()

export function CameraControls({ onClose }: CameraControlsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const settings = useCameraSettingsValues()
  console.log('🚀 ~ CameraControls ~ settings:', settings)
  console.log('save')
  const handleSave = async (): Promise<void> => {
    await updateCameraImageSettings({
      cameraId: 'ot_system_camera',
      zoom: zoomStringToNumber(settings.zoom),
      brightness: settings.brightness,
      contrast: settings.contrast,
      saturation: settings.saturation,
    })
    onClose()
  }

  return (
    <Modal onClose={onClose} title={t('camera_controls')} width="46rem">
      <div className={styles.container}>
        <div className={styles.content_container}>
          <CameraControlSettings settings={settings} />
          <PreviewSettings />
        </div>
        <div className={styles.footer_container}>
          <TextOnlyButton
            onClick={settings.restoreToDefault}
            buttonText={t('restore_to_default')}
          />
          <PrimaryButton onClick={handleSave}>{t('save')}</PrimaryButton>
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
