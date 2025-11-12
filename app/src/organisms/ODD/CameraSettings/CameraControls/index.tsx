import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import { useStubCameraSettingsValues } from '/app/organisms/Desktop/Camera/CameraControls/hooks/useStubCameraSettingsValues'

import { CameraControlsHome } from './CameraControlsHome'
import { CameraTileSetting } from './CameraTileSetting'
import { ZoomSettingsView } from './ZoomSettingsView'

export type ActiveControlView =
  | 'zoom'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | null

export interface CameraControlsProps {
  toggleShowControls: () => void
}

export function CameraControls({
  toggleShowControls,
}: CameraControlsProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const [activeSubView, setActiveSubView] = useState<ActiveControlView>(null)
  const settings = useStubCameraSettingsValues()

  const returnToHomeView = (): void => {
    setActiveSubView(null)
  }

  switch (activeSubView) {
    case 'zoom':
      return (
        <ZoomSettingsView
          zoomValue={settings.zoom}
          adjustZoom={settings.adjustZoom}
          returnToHomeView={returnToHomeView}
        />
      )

    case 'brightness':
      return (
        <CameraTileSetting
          value={settings.brightness}
          title={t('brightness')}
          subtext={t('adjust_brightness')}
          adjustValue={settings.adjustBrightness}
          returnToHomeView={returnToHomeView}
        />
      )

    case 'contrast':
      return (
        <CameraTileSetting
          value={settings.contrast}
          title={t('contrast')}
          subtext={t('adjust_contrast')}
          adjustValue={settings.adjustContrast}
          returnToHomeView={returnToHomeView}
        />
      )

    case 'saturation':
      return (
        <CameraTileSetting
          value={settings.saturation}
          title={t('saturation')}
          subtext={t('adjust_saturation')}
          adjustValue={settings.adjustSaturation}
          returnToHomeView={returnToHomeView}
        />
      )

    default:
      return (
        <CameraControlsHome
          settings={settings}
          setActiveSubView={setActiveSubView}
          toggleShowControls={toggleShowControls}
        />
      )
  }
}
