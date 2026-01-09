import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  Slider,
} from '@opentrons/components'

import { TextOnlyButton } from '/app/atoms/buttons'
import { Divider } from '/app/atoms/structure'
import { useCameraSettingsValues } from '/app/local-resources/images/hooks/useCameraSettingsValues'
import { updateCameraSpecificSettings } from '/app/redux/protocol-runs'

import styles from './cameracontrols.module.css'
import { PreviewSettings } from './PreviewSettings'
import { ZoomSettings } from './ZoomSettings'

import type { UseCameraSettingsValuesResult } from '/app/local-resources/images/hooks/useCameraSettingsValues'

export interface CameraControlsProps {
  onClose: () => void
  runId: string | null
}

export function CameraControls({
  onClose,
  runId,
}: CameraControlsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const settings = useCameraSettingsValues(runId)
  const dispatch = useDispatch()

  const handleSave = (): void => {
    dispatch(
      updateCameraSpecificSettings(runId ?? '', 'ot_system_camera', {
        zoom: settings.zoom,
        brightness: settings.brightness,
        contrast: settings.contrast,
        saturation: settings.saturation,
      })
    )
  }

  return (
    <Modal onClose={onClose} title={t('camera_controls')} width="46rem">
      <div className={styles.container}>
        <div className={styles.content_container}>
          <CameraControlSettings settings={settings} />
          <PreviewSettings
            settings={{
              zoom: settings.zoom,
              brightness: settings.brightness,
              contrast: settings.contrast,
              saturation: settings.saturation,
            }}
            runId={runId}
          />
        </div>
        <div className={styles.footer_container}>
          <TextOnlyButton
            onClick={settings.restoreToDefault}
            buttonText={t('restore_to_default')}
          />
          <div className={styles.buttons}>
            <SecondaryButton onClick={onClose}>{t('Cancel')}</SecondaryButton>
            <PrimaryButton onClick={handleSave}>
              <div className={styles.save_button}>{t('save')}</div>
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
