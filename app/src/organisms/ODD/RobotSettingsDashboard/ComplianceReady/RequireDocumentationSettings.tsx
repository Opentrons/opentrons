import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { ChildNavigation } from '../../ChildNavigation'
import styles from './compliance_ready_settings.module.css'
import { NumericSettingPage } from './NumericSettingPage'
import { SettingsListButton } from './SettingsListButton'
import { ToggleSetting } from './ToggleSetting'

import type { ReactNode } from 'react'
import type { AuditSettingsData } from '@opentrons/api-client'

export function RequireDocumentationSettings({
  onClickBack,
  auditSettings,
  patchAuditSettings,
}: {
  onClickBack: () => void
  auditSettings?: AuditSettingsData
  patchAuditSettings: (settings: Partial<AuditSettingsData>) => void
}): ReactNode {
  const { t } = useTranslation('device_settings')
  const [showMinLength, setShowMinLength] = useState(false)

  const documentationEnabled = !!auditSettings?.requireReasonForInteraction

  if (showMinLength) {
    return (
      <NumericSettingPage
        title={t('odd_minimum_length_for_documentation')}
        description={t('odd_minimum_length_for_documentation_description')}
        value={auditSettings?.minLengthOfReasonForInteraction ?? 0}
        label={t('odd_number_of_characters')}
        onBack={value => {
          patchAuditSettings({
            minLengthOfReasonForInteraction: value,
          })
          setShowMinLength(false)
        }}
        min={1}
      />
    )
  }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('odd_require_documentation_for_robot_actions')}
        onClickBack={onClickBack}
      />
      <div className={styles.password_complexity_content}>
        <ToggleSetting
          title={t('odd_require_documentation_for_robot_actions')}
          value={documentationEnabled}
          onClick={() => {
            if (!documentationEnabled) {
              patchAuditSettings({ requireReasonForInteraction: true })
            } else {
              patchAuditSettings({
                requireReasonForInteraction: false,
              })
            }
          }}
        />
        {documentationEnabled && (
          <div className={styles.settings_preferences}>
            <StyledText oddStyle="level4HeaderSemiBold">
              {t('odd_preferences')}
            </StyledText>
            <div className={styles.settings_preferences_list}>
              <SettingsListButton
                key={t('odd_minimum_length_for_documentation')}
                title={t('odd_minimum_length_for_documentation_description')}
                value={`${auditSettings?.minLengthOfReasonForInteraction ?? 0} ${t('odd_characters')}`}
                onClick={() => {
                  setShowMinLength(true)
                }}
                chevron
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
