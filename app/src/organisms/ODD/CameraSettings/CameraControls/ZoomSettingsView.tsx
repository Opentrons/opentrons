import { useTranslation } from 'react-i18next'

import { RadioButton, StyledText } from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './cameracontrols.module.css'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import type { UseStubCameraSettingsValuesResult } from '/app/organisms/Desktop/Camera/CameraControls/hooks/useStubCameraSettingsValues'

const ZOOM_VALUES: Array<UseStubCameraSettingsValuesResult['zoom']> = [
  '1x',
  '1.5x',
  '2x',
]

export interface ZoomSettingsViewProps {
  zoomValue: UseStubCameraSettingsValuesResult['zoom']
  adjustZoom: UseStubCameraSettingsValuesResult['adjustZoom']
  returnToHomeView: () => void
}

export function ZoomSettingsView({
  zoomValue,
  adjustZoom,
  returnToHomeView,
}: ZoomSettingsViewProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const buildSubLabel = (
    value: UseStubCameraSettingsValuesResult['zoom']
  ): string => {
    switch (value) {
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
      <ChildNavigation header={t('zoom')} onClickBack={returnToHomeView} />
      <div className={styles.content_container}>
        <StyledText oddStyle="level4HeaderRegular">
          {t('adjust_deck_appearance')}
        </StyledText>
        <div className={styles.zoom_btn_container}>
          {ZOOM_VALUES.map(val => {
            return (
              <RadioButton
                key={val}
                radioButtonType="large"
                buttonLabel={t(val)}
                buttonSubLabel={{
                  label: buildSubLabel(val),
                  align: 'vertical',
                }}
                buttonValue={val}
                isSelected={val === zoomValue}
                onChange={() => {
                  adjustZoom(val)
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
