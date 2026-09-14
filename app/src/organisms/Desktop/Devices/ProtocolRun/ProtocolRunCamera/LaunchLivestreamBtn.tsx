import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { Icon, SecondaryButton } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { cameraStreamOpenAction } from '/app/redux/shell'

import styles from './runcamera.module.css'

import type { ReactNode } from 'react'
import type { RobotType } from '@opentrons/shared-data'

export function LaunchLivestreamBtn({
  runId,
  robotType,
}: {
  runId: string
  robotType: RobotType
}): ReactNode {
  const { t } = useTranslation('run_details')
  const dispatch = useDispatch()
  const host = useHost()
  const isLaunchCameraEnabled =
    host?.robotName != null && host?.hostname != null
  const { reportLiveFeedUsage } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType,
  })
  const handleOpenCameraStream = (): void => {
    dispatch(
      cameraStreamOpenAction(
        host?.hostname ?? 'UNKNOWN',
        host?.robotName ?? 'UNKNOWN',
        t('branded:livestream_window_title', {
          robotName: host?.robotName ?? '',
        }) as string
      )
    )
    reportLiveFeedUsage({
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
