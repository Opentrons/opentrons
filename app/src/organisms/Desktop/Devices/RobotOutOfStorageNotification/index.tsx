import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { InlineNotification } from '@opentrons/components'

import type { ReactNode } from 'react'

interface RobotOutOfStorageNotificationProps {
  robotName: string
  onCloseClick?: (e?: MouseEvent) => void
}

export function RobotOutOfStorageNotification(
  props: RobotOutOfStorageNotificationProps
): ReactNode {
  const { robotName, onCloseClick } = props
  const { t } = useTranslation('device_details')
  const navigate = useNavigate()

  return (
    <InlineNotification
      type="alert"
      heading={t('robot_storage_almost_full')}
      message={t('downlad_and_delete_to_run')}
      linkText={t('manage_files')}
      onLinkClick={() => {
        navigate(`/devices/${robotName}/robot-settings/file-manager`)
      }}
      onCloseClick={onCloseClick}
    />
  )
}
