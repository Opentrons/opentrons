import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { Icon, SecondaryButton } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { cameraStreamOpenAction } from '/app/redux/shell'

import styles from './runcamera.module.css'

export function LaunchLivestreamBtn(): JSX.Element {
  const { t } = useTranslation('run_details')
  const dispatch = useDispatch()
  const host = useHost()
  const isLaunchCameraEnabled =
    host?.robotName != null && host?.hostname != null

  const handleOpenCameraStream = (): void => {
    dispatch(
      cameraStreamOpenAction(
        host?.hostname ?? 'UNKNOWN',
        host?.robotName ?? 'UNKNOWN'
      )
    )
  }

  return (
    <SecondaryButton
      className={styles.launch_camera_btn}
      aria-disabled={!isLaunchCameraEnabled}
      onClick={handleOpenCameraStream}
    >
      {t('live_camera_view')}
      <Icon className={styles.launch_icon_style} name="open-in-new" />
    </SecondaryButton>
  )
}
