import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { InlineNotification } from '@opentrons/components'

interface RobotOutOfStorageNotificationProps {
  robotName: string
<<<<<<< Updated upstream
=======
  onCloseClick?: (e?: MouseEvent) => void
>>>>>>> Stashed changes
}

export function RobotOutOfStorageNotification(
  props: RobotOutOfStorageNotificationProps
): JSX.Element {
<<<<<<< Updated upstream
  const { robotName } = props
=======
  const { robotName, onCloseClick } = props
>>>>>>> Stashed changes
  const { t } = useTranslation('device_details')
  const navigate = useNavigate()

  return (
    <InlineNotification
<<<<<<< Updated upstream
      type="error"
      heading={t('robot_storage_almost_full')}
      message={t('downlad_and_delete_to_run')}
      linkText={t('manage_files')}
      onLinkClick={() => {
=======
      type="alert"
      heading={t('robot_storage_almost_full')}
      message={t('downlad_and_delete_to_run')}
      linkText={t('manage_files')}
      onCloseClick={onCloseClick}
      onLinkClick={e => {
        e.stopPropagation()
>>>>>>> Stashed changes
        navigate(`/devices/${robotName}/robot-settings/file-manager`)
      }}
    />
  )
}
