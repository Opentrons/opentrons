import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { InlineNotification } from '@opentrons/components'

interface RobotOutOfStorageNotificationProps {
  robotName: string
}

export function RobotOutOfStorageNotification(
  props: RobotOutOfStorageNotificationProps
): JSX.Element {
  const { robotName } = props
  const { t } = useTranslation('device_details')
  const navigate = useNavigate()

  return (
    <InlineNotification
      type="error"
      heading={t('robot_storage_almost_full')}
      message={t('downlad_and_delete_to_run')}
      linkText={t('manage_files')}
      onLinkClick={() => {
        navigate(`/devices/${robotName}/robot-settings/file-manager`)
      }}
    />
  )
}
