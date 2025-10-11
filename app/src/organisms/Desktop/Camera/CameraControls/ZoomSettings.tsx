import { useTranslation } from 'react-i18next'
import clsx from 'clsx'

import { StyledText } from '@opentrons/components'

import styles from './cameracontrols.module.css'

import type { UseStubCameraSettingsValuesResult } from './hooks/useStubCameraSettingsValues'

export interface ZoomSettingsProps {
  zoom: UseStubCameraSettingsValuesResult['zoom']
  adjustZoom: UseStubCameraSettingsValuesResult['adjustZoom']
}

export function ZoomSettings({
  adjustZoom,
  zoom,
}: ZoomSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.zoom_container}>
      <div className={styles.zoom_text_container}>
        <StyledText desktopStyle="bodyDefaultSemiBold">{t('zoom')}</StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('increase_deck_appearance')}
        </StyledText>
      </div>
      <div className={styles.zoom_btn_container}>
        <ZoomBtn currentZoom={zoom} btnZoomValue="1x" adjustZoom={adjustZoom} />
        <ZoomBtn
          currentZoom={zoom}
          btnZoomValue="1.5x"
          adjustZoom={adjustZoom}
        />
        <ZoomBtn currentZoom={zoom} btnZoomValue="2x" adjustZoom={adjustZoom} />
      </div>
    </div>
  )
}

interface ZoomBtnProps {
  currentZoom: UseStubCameraSettingsValuesResult['zoom']
  btnZoomValue: UseStubCameraSettingsValuesResult['zoom']
  adjustZoom: UseStubCameraSettingsValuesResult['adjustZoom']
}

function ZoomBtn({
  currentZoom,
  btnZoomValue,
  adjustZoom,
}: ZoomBtnProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const onClick = (): void => {
    adjustZoom(btnZoomValue)
  }
  const isActive = currentZoom === btnZoomValue

  const buildBtnCopy = (): string => {
    switch (btnZoomValue) {
      case '1x':
        return t('default')
      case '1.5x':
        return t('moderate')
      case '2x':
        return t('maximum')
    }
  }

  return (
    <button
      onClick={onClick}
      className={clsx(
        styles.zoom_btn,
        isActive ? styles.zoom_btn_active : styles.zoom_btn_inactive
      )}
    >
      <span
        className={
          isActive ? styles.zoom_btn_txt_active : styles.zoom_btn_txt_inactive
        }
      >
        {t(btnZoomValue)}
      </span>
      <StyledText className={styles.zoom_btn_txt} desktopStyle="captionRegular">
        {buildBtnCopy()}
      </StyledText>
    </button>
  )
}
