import { useState } from 'react'

import { StyledText } from '@opentrons/components'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import { useStubCameraUsageSettings } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useStubCameraUsageSettings'

import { CameraControls } from './CameraControls'
import { CameraEnableSetting } from './CameraEnableSetting'
import { ControlPreferencesSettings } from './ControlPreferencesSettings'
import styles from './preferences.module.css'
import { UsagePreferencesSettings } from './UsagePreferencesSettings'

import type { ReactNode } from 'react'

export interface CameraSettingsProps {
  /* A header element for the page content. */
  headerElement: ReactNode
  sectionHeadingText: string
}

export function CameraSettings({
  headerElement,
  sectionHeadingText,
}: CameraSettingsProps): JSX.Element {
  const {
    isCameraEnabled,
    toggleCameraEnabled,
    toggleLiveVideoEnabled,
    isLiveVideoEnabled,
    isRecoveryCaptureEnabled,
    toggleRecoveryCaptureEnabled,
  } = useStubCameraUsageSettings()

  const [showControls, setShowControls] = useState(false)
  const toggleShowControls = (): void => {
    setShowControls(!showControls)
  }

  if (showControls) {
    return <CameraControls toggleShowControls={toggleShowControls} />
  } else {
    return (
      <div className={styles.container}>
        {headerElement}
        <div className={styles.content_container}>
          <StyledText oddStyle="level4HeaderRegular">
            {sectionHeadingText}
          </StyledText>
          <CameraEnableSetting
            isCameraEnabled={isCameraEnabled}
            toggleCameraEnabled={toggleCameraEnabled}
          />
          {isCameraEnabled && (
            <>
              <UsagePreferencesSettings
                toggleLiveVideoEnabled={toggleLiveVideoEnabled}
                toggleRecoveryCaptureEnabled={toggleRecoveryCaptureEnabled}
                isLiveVideoEnabled={isLiveVideoEnabled}
                isRecoveryCaptureEnabled={isRecoveryCaptureEnabled}
              />
              <ControlPreferencesSettings
                toggleShowControls={toggleShowControls}
              />
            </>
          )}
        </div>
      </div>
    )
  }
}
