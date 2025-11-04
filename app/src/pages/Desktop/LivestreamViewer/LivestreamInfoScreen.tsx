import { useTranslation } from 'react-i18next'

import { InfoScreen } from '@opentrons/components'
import { useCamera } from '@opentrons/react-api-client'

import { isTerminalRunStatus } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunHeader/utils'
import { useNotifyRunQuery } from '/app/resources/runs'

const CAMERA_POLLING_INTERVAL_MS = 5000

type LiveStreamInfoScreenType =
  | 'loading'
  | 'error'
  | 'disabled'
  | 'run-terminal'
  | null

export function useLivestreamInfoScreen(
  runId: string,
  videoError: string | null
): LiveStreamInfoScreenType {
  const { data: runData, isLoading: isRunLoading } = useNotifyRunQuery(runId)
  const { data: cameraData, isLoading: isCameraSettingsLoading } = useCamera({
    refetchInterval: CAMERA_POLLING_INTERVAL_MS,
  })
  const runStatus = runData?.data.status ?? null
  const isCameraEnabled = cameraData?.cameraEnabled ?? false

  if (videoError != null) {
    return 'error'
  } else if (isRunLoading || isCameraSettingsLoading) {
    return 'loading'
  } else if (isTerminalRunStatus(runStatus)) {
    return 'run-terminal'
  } else if (!isCameraEnabled) {
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
    case 'run-terminal':
      return <InfoScreen content={t('live_video_ended')} />
    default:
      console.error(`Handle live stream error case explicitly: ${type}`)
      return <></>
  }
}
