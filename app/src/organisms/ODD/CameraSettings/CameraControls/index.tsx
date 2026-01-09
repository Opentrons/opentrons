import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { useCreateCameraImageSettings } from '@opentrons/react-api-client'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import { useCameraSettingsValues } from '/app/local-resources/images/hooks/useCameraSettingsValues'
import { updateCameraSpecificSettings } from '/app/redux/protocol-runs'

import { CameraControlsHome } from './CameraControlsHome'
import { CameraTileSetting } from './CameraTileSetting'
import { ZoomSettingsView } from './ZoomSettingsView'

import type { CameraImageSettings } from '@opentrons/api-client'

export type ActiveControlView =
  | 'zoom'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | null

export interface CameraControlsProps {
  toggleShowControls: () => void
  runId: string | null
}

export function CameraControls({
  toggleShowControls,
  runId,
}: CameraControlsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [activeSubView, setActiveSubView] = useState<ActiveControlView>(null)
  const settings = useCameraSettingsValues(runId)
  const { createCameraImageSettings } = useCreateCameraImageSettings()

  const returnToHomeView = (settings: CameraImageSettings): void => {
    setIsLoading(true)

    if (runId != null) {
      dispatch(
        updateCameraSpecificSettings(runId, 'ot_system_camera', {
          zoom: settings.zoom,
          brightness: settings.brightness,
          contrast: settings.contrast,
          saturation: settings.saturation,
        })
      )
    } else {
      createCameraImageSettings(settings, {
        onSuccess: () => {
          setActiveSubView(null)
        },
        onSettled: () => {
          setIsLoading(false)
        },
      })
    }
  }

  switch (activeSubView) {
    case 'zoom':
      return (
        <ZoomSettingsView
          zoomValue={settings.zoom}
          adjustZoom={settings.adjustZoom}
          returnToHomeView={() => {
            returnToHomeView({ zoom: settings.zoom })
          }}
          isLoading={isLoading}
        />
      )

    case 'brightness':
      return (
        <CameraTileSetting
          value={settings.brightness}
          title={t('brightness')}
          subtext={t('adjust_brightness')}
          adjustValue={settings.adjustBrightness}
          returnToHomeView={() => {
            returnToHomeView({ brightness: settings.brightness })
          }}
          isLoading={isLoading}
        />
      )

    case 'contrast':
      return (
        <CameraTileSetting
          value={settings.contrast}
          title={t('contrast')}
          subtext={t('adjust_contrast')}
          adjustValue={settings.adjustContrast}
          returnToHomeView={() => {
            returnToHomeView({ contrast: settings.contrast })
          }}
          isLoading={isLoading}
        />
      )

    case 'saturation':
      return (
        <CameraTileSetting
          value={settings.saturation}
          title={t('saturation')}
          subtext={t('adjust_saturation')}
          adjustValue={settings.adjustSaturation}
          returnToHomeView={() => {
            returnToHomeView({ saturation: settings.saturation })
          }}
          isLoading={isLoading}
        />
      )

    default:
      return (
        <CameraControlsHome
          settings={settings}
          setActiveSubView={setActiveSubView}
          toggleShowControls={toggleShowControls}
          runId={runId}
        />
      )
  }
}
