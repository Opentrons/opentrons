import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { TouchControlButton } from '/app/atoms/buttons/TouchControlButton'
import { zoomNumberToString } from '/app/local-resources/images/utils/cameraUtils'

import styles from './cameracontrols.module.css'

import type { ReactNode } from 'react'
import type { UseCameraSettingsValuesResult } from '/app/local-resources/images/hooks/useCameraSettingsValues'

export interface ZoomSettingsProps {
  zoom: UseCameraSettingsValuesResult['zoom']
  adjustZoom: UseCameraSettingsValuesResult['adjustZoom']
}

export function ZoomSettings({
  adjustZoom,
  zoom,
}: ZoomSettingsProps): ReactNode {
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
        <ZoomBtn currentZoom={zoom} btnZoomValue={1} adjustZoom={adjustZoom} />
        <ZoomBtn
          currentZoom={zoom}
          btnZoomValue={1.5}
          adjustZoom={adjustZoom}
        />
        <ZoomBtn currentZoom={zoom} btnZoomValue={2} adjustZoom={adjustZoom} />
      </div>
    </div>
  )
}

interface ZoomBtnProps {
  currentZoom: UseCameraSettingsValuesResult['zoom']
  btnZoomValue: UseCameraSettingsValuesResult['zoom']
  adjustZoom: UseCameraSettingsValuesResult['adjustZoom']
}

function ZoomBtn({
  currentZoom,
  btnZoomValue,
  adjustZoom,
}: ZoomBtnProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const btnZoomValueString = zoomNumberToString(btnZoomValue)

  const onClick = (): void => {
    adjustZoom(btnZoomValueString)
  }
  const isActive = currentZoom === btnZoomValue
  const buildBtnCopy = (): string => {
    switch (btnZoomValueString) {
      case '1x':
        return t('default')
      case '1.5x':
        return t('moderate')
      case '2x':
        return t('maximum')
    }
  }

  return (
    <TouchControlButton
      onClick={onClick}
      title={btnZoomValueString}
      subText={buildBtnCopy()}
      isActive={isActive}
      isOnDevice={false}
    />
  )
}
