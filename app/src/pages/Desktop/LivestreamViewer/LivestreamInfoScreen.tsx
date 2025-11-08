import { useTranslation } from 'react-i18next'

import {
  RUN_STATUS_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_IDLE,
} from '@opentrons/api-client'
import { InfoScreen } from '@opentrons/components'

import { isTerminalRunStatus } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunHeader/utils'

import type { CameraData, RunStatus } from '@opentrons/api-client'

type LiveStreamInfoScreenType =
  | 'loading'
  | 'error'
  | 'disabled'
  | 'run-setup'
  | 'run-terminal'
  | null

export function useLivestreamInfoScreen(
  runStatus: RunStatus | null,
  cameraData: CameraData | null,
  isRunLoading: boolean,
  videoError: string | null
): LiveStreamInfoScreenType {
  // camera data can only undefined before a run starts unless actively being fetched.
  const unconfirmedSettingsDuringRunSetup =
    cameraData == null &&
    !isRunLoading &&
    (runStatus === RUN_STATUS_BLOCKED_BY_OPEN_DOOR ||
      runStatus === RUN_STATUS_IDLE)

  if (unconfirmedSettingsDuringRunSetup) {
    return 'run-setup'
  } else if (isRunLoading) {
    return 'loading'
  } else if (isTerminalRunStatus(runStatus)) {
    return 'run-terminal'
  } else if (videoError != null) {
    return 'error'
  } else if (!cameraData?.liveStreamEnabled) {
    return 'disabled'
  } else {
    return null
  }
}

export function LivestreamInfoScreen({
  type,
}: {
  type: LiveStreamInfoScreenType
}): JSX.Element {
  const { t } = useTranslation('run_details')

  switch (type) {
    case 'loading':
      return <InfoScreen iconName="ot-spinner" content={t('camera_loading')} />
    case 'error':
      return (
        <InfoScreen
          content={t('camera_load_failed')}
          subContent={t('camera_relaunch')}
        />
      )
    case 'disabled':
      return <InfoScreen content={t('camera_disabled')} />
    case 'run-setup':
      return (
        <InfoScreen
          content={t('confirm_camera_preferences')}
          subContent={t('confirm_camera_preferences_desc')}
        />
      )
    case 'run-terminal':
      return <InfoScreen content={t('live_video_ended')} />
    default:
      console.error(`Handle live stream error case explicitly: ${type}`)
      return <></>
  }
}
