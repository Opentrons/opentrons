import { useTranslation } from 'react-i18next'

import { RadioButton, StyledText } from '@opentrons/components'

import { zoomNumberToString } from '/app/local-resources/images/utils/cameraUtils'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './cameracontrols.module.css'

import type { ReactNode } from 'react'
import type { UseCameraSettingsValuesResult } from '/app/local-resources/images/hooks/useCameraSettingsValues'

const ZOOM_VALUES: Array<UseCameraSettingsValuesResult['zoom']> = [1, 1.5, 2]

export interface ZoomSettingsViewProps {
  zoomValue: UseCameraSettingsValuesResult['zoom']
  adjustZoom: UseCameraSettingsValuesResult['adjustZoom']
  returnToHomeView: () => void
  isLoading: boolean
}

export function ZoomSettingsView({
  zoomValue,
  adjustZoom,
  returnToHomeView,
  isLoading,
}: ZoomSettingsViewProps): ReactNode {
  const { t } = useTranslation('device_settings')

  const buildSubLabel = (
    value: UseCameraSettingsValuesResult['zoom']
  ): string => {
    const zoomString = zoomNumberToString(value)
    switch (zoomString) {
      case '1x':
        return t('default')
      case '1.5x':
        return t('moderate')
      case '2x':
        return t('maximum')
    }
  }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('zoom')}
        onClickBack={returnToHomeView}
        iconName={isLoading ? 'ot-spinner' : 'back'}
      />
      <div className={styles.content_container}>
        <StyledText oddStyle="level4HeaderRegular">
          {t('adjust_deck_appearance')}
        </StyledText>
        <div className={styles.zoom_btn_container}>
          {ZOOM_VALUES.map(val => {
            const zoomString = zoomNumberToString(val)
            return (
              <RadioButton
                key={val}
                radioButtonType="large"
                buttonLabel={t(zoomString)}
                buttonSubLabel={{
                  label: buildSubLabel(val),
                  align: 'vertical',
                }}
                buttonValue={zoomString}
                isSelected={val === zoomValue}
                onChange={() => {
                  adjustZoom(zoomString)
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
