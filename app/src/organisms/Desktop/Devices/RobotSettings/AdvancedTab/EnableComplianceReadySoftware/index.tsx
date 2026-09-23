import { useTranslation } from 'react-i18next'

import { Chip, LegacyStyledText, TYPOGRAPHY } from '@opentrons/components'
import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { TertiaryButton } from '/app/atoms/buttons'
import { handleEnableCRSWizard } from '/app/organisms/Desktop/EnableCRSWizard'

import styles from './index.module.css'

interface Props {
  isRobotBusy: boolean
  robotName: string
}

export function EnableComplianceReadySoftware(props: Props): JSX.Element {
  const { isRobotBusy, robotName } = props
  const { t } = useTranslation('device_settings')

  const crsEnabledQuery = useAccessControlEnabledQuery()
  const isCRSEnabledQuerySuccessful = crsEnabledQuery.isSuccess
  const isCRSEnabled = crsEnabledQuery.data?.data.accessControlEnabled ?? false

  const isButtonEnabled =
    isCRSEnabledQuerySuccessful && !isCRSEnabled && !isRobotBusy

  return (
    <div className={styles.container}>
      <div className={styles.text_container}>
        <div className={styles.title_row}>
          <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
            {t('crs_title')}
          </LegacyStyledText>
          {isCRSEnabledQuerySuccessful ? (
            <Chip
              chipSize="small"
              hasIcon={false}
              type={isCRSEnabled ? 'success' : 'neutral'}
              text={isCRSEnabled ? t('enabled') : t('disabled')}
            />
          ) : null}
        </div>
        <LegacyStyledText forwardedAs="p">
          {t('crs_description')}
        </LegacyStyledText>
      </div>
      <TertiaryButton
        onClick={() => {
          handleEnableCRSWizard({ robotName })
        }}
        disabled={!isButtonEnabled}
      >
        {t('crs_button')}
      </TertiaryButton>
    </div>
  )
}
