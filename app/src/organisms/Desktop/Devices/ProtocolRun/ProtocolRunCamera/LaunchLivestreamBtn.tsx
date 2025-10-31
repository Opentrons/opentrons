import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { Icon, SecondaryButton } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { useCameraAnalytics } from '/app/redux-resources/analytics/'
import { cameraStreamOpenAction } from '/app/redux/shell'

import styles from './runcamera.module.css'
import type { RobotType } from '@opentrons/shared-data'

export function LaunchLivestreamBtn({
  runId,
  robotType,
}: {
  runId: string
  robotType: RobotType
}): JSX.Element {
  const { t } = useTranslation('run_details')
  const dispatch = useDispatch()
  const host = useHost()
  const isLaunchCameraEnabled =
    host?.robotName != null && host?.hostname != null
  const baseParams = {
    source: 'protocolRunRecord' as const,
    runId: runId,
    robotType,
  }
  const { reportLiveFeedUsage } = useCameraAnalytics(baseParams)
  const handleOpenCameraStream = (): void => {
    dispatch(
      cameraStreamOpenAction(
        host?.hostname ?? 'UNKNOWN',
        host?.robotName ?? 'UNKNOWN',
        runId,
        t('branded:livestream_window_title') as string
      )
    )
    // how to get if there was an error or if it actually loaded?
    reportLiveFeedUsage({
      ...baseParams,
      amount: 1,
      errorDetails: '',
      runId: runId,
    })
  }

  return (
    <SecondaryButton
      className={styles.launch_camera_btn}
      aria-disabled={!isLaunchCameraEnabled}
      onClick={handleOpenCameraStream}
    >
      {t('live_camera')}
      <Icon className={styles.launch_icon_style} name="open-in-new" />
    </SecondaryButton>
  )
}
