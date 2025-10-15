import { useTranslation } from 'react-i18next'

import { Modal, PrimaryButton, StyledText } from '@opentrons/components'

import { TextOnlyButton } from '/app/atoms/buttons'
import { Divider } from '/app/atoms/structure'

import styles from './cameracontrols.module.css'
import { useStubCameraSettingsValues } from './hooks/useStubCameraSettingsValues'
import { PreviewSettings } from './PreviewSettings'
import { ZoomSettings } from './ZoomSettings'

import type { UseStubCameraSettingsValuesResult } from './hooks/useStubCameraSettingsValues'

export interface CameraControlsProps {
  onClose: () => void
}

export function CameraControls({ onClose }: CameraControlsProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const settings = useStubCameraSettingsValues()

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
          <PrimaryButton
            onClick={() => {
              console.log('Stubbed setting savings...')
            }}
          >
            {t('save')}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}

interface CameraControlSettingsProps {
  settings: UseStubCameraSettingsValuesResult
}

function CameraControlSettings({
  settings,
}: CameraControlSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.settings_container}>
      <ZoomSettings zoom={settings.zoom} adjustZoom={settings.adjustZoom} />
      <Divider />
      <SliderSetting
        title={t('brightness')}
        subtext={t('adjust_brightness')}
        adjustValue={settings.adjustBrightness}
        value={settings.brightness}
      />
      <Divider />
      <SliderSetting
        title={t('contrast')}
        subtext={t('adjust_contrast')}
        adjustValue={settings.adjustContrast}
        value={settings.contrast}
      />
      <Divider />
      <SliderSetting
        title={t('saturation')}
        subtext={t('adjust_saturation')}
        adjustValue={settings.adjustSaturation}
        value={settings.saturation}
      />
    </div>
  )
}

interface SliderSettingProps {
  title: string
  subtext: string
  value: number
  adjustValue: (value: number) => void
}

function SliderSetting({
  value,
  title,
  subtext,
  adjustValue,
}: SliderSettingProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.slider_setting_container}>
      <div className={styles.slider_setting_text_container}>
        <StyledText desktopStyle="bodyDefaultSemiBold">{title}</StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">{subtext}</StyledText>
      </div>
      <div className={styles.slider_value_container}>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={e => {
            adjustValue(Number(e.target.value))
          }}
          className={styles.slider_basic}
          // @ts-expect-error Expected. We want to use style here to avoid more complex
          //  data-attribute CSS calculations.
          style={{ '--slider-progress': `${value}%` }}
          aria-label={title}
        />
        <StyledText
          className={styles.slider_percentage}
          desktopStyle="bodyDefaultSemiBold"
        >
          {t('value_percent', { value })}
        </StyledText>
      </div>
    </div>
  )
}
