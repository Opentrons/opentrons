import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Banner, BasicButton, StyledText } from '@opentrons/components'

import styles from './robotoutofstoragebanner.module.css'

interface RobotOutOfStorageBannerProps {
  robotName: string
}

export function RobotOutOfStorageBanner(
  props: RobotOutOfStorageBannerProps
): JSX.Element {
  const { robotName } = props
  const { t } = useTranslation('device_details')
  const navigate = useNavigate()

  return (
    <Banner type="error">
      <div className={styles.container}>
        <div className={styles.text_body}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('robot_storage_almost_full')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('downlad_and_delete_to_run')}
          </StyledText>
        </div>
      </div>
      <div className={styles.link_body}>
        <BasicButton
          onClick={() => {
            navigate(`/devices/${robotName}/robot-settings/file-manager`)
          }}
          underLine
        >
          {t('manage_files')}
        </BasicButton>
      </div>
    </Banner>
  )
}
