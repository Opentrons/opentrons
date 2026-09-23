import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Icon,
  Modal,
  PrimaryButton,
  SecondaryButton,
  Slider,
  StyledText,
} from '@opentrons/components'
import { useCreateCameraImageSettings } from '@opentrons/react-api-client'

import { TextOnlyButton } from '/app/atoms/buttons'
import { Divider } from '/app/atoms/structure'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useCameraSettingsValues } from '/app/local-resources/images/hooks/useCameraSettingsValues'
import { updateCameraSpecificSettings } from '/app/redux/protocol-runs'

import styles from './cameracontrols.module.css'
import { PreviewSettings } from './PreviewSettings'
import { ZoomSettings } from './ZoomSettings'

import type { CameraImageSettings } from '@opentrons/api-client'
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
  const documentationState = useDocumentationState()
  const { createCameraImageSettings } =
    useCreateCameraImageSettings(documentationState)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = (): void => {
    setIsLoading(true)

    const cameraImageSettings: CameraImageSettings = {
      zoom: settings.zoom,
      brightness: settings.brightness,
      contrast: settings.contrast,
      saturation: settings.saturation,
    }

    if (runId != null) {
      dispatch(
        updateCameraSpecificSettings(
          runId,
          'ot_system_camera',
          cameraImageSettings
        )
      )
      onClose()
    } else {
      createCameraImageSettings(cameraImageSettings, {
        onSuccess: () => {
          onClose()
        },
        onSettled: () => {
          setIsLoading(false)
        },
      })
    }
  }

  return (
    <Modal onClose={onClose} title={t('camera_controls')} width="46rem">
      <div className={styles.container}>
        <div className={styles.content_container}>
          <CameraControlSettings settings={settings} />
          <PreviewSettings
            documentationState={documentationState}
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
      <div className={styles.controls_section_container}>
        <div className={styles.controls_section_text_container}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('brightness')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('adjust_brightness')}
          </StyledText>
        </div>
        <Slider
          adjustValue={settings.adjustBrightness}
          value={settings.brightness}
        />
      </div>
      <Divider />
      <div className={styles.controls_section_container}>
        <div className={styles.controls_section_text_container}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('contrast')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('adjust_contrast')}
          </StyledText>
        </div>
      </div>
      <Slider adjustValue={settings.adjustContrast} value={settings.contrast} />
      <Divider />
      <div className={styles.controls_section_container}>
        <div className={styles.controls_section_text_container}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('saturation')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('adjust_saturation')}
          </StyledText>
        </div>
        <Slider
          adjustValue={settings.adjustSaturation}
          value={settings.saturation}
        />
      </div>
    </div>
  )
}
