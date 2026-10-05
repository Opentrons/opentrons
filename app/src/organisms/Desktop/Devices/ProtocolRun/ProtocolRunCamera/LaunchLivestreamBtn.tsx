import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { Icon, SecondaryButton } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'
import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { OPENTRONS_USB } from '/app/redux/discovery'
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
  const { makeSnackbar } = useToaster()
  const isUsbConnection = host?.hostname === OPENTRONS_USB
  const isLaunchCameraEnabled =
    host?.robotName != null && host?.hostname != null
  const { reportLiveFeedUsage } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType,
  })
  const handleOpenCameraStream = (): void => {
    if (isUsbConnection) {
      makeSnackbar(t('connect_to_network_for_live_camera') as string)
      return
    }

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
