import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ChildNavigation } from '../../ChildNavigation'
import styles from './compliance_ready_settings.module.css'
import { MIN_LENGTH_OF_REASON_FOR_INTERACTION } from './constants'
import { RequireDocumentationSettings } from './RequireDocumentationSettings'
import { SettingsListButton } from './SettingsListButton'
import { ToggleSetting } from './ToggleSetting'

import type { ReactNode } from 'react'
import type {
  AuditSettingsData,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'

export function AuditLogRequirements({
  onClickBack,
  auditSettings,
  patchAuditSettings,
  robotServerSettings,
  patchRobotServerSettings,
}: {
  onClickBack: () => void
  auditSettings?: Partial<AuditSettingsData>
  patchAuditSettings: (auditSettings: Partial<AuditSettingsData>) => void
  robotServerSettings?: Partial<RobotServerAccessControlSettingsData>
  patchRobotServerSettings: (
    robotServerSettings: Partial<RobotServerAccessControlSettingsData>
  ) => void
}): ReactNode {
  const { t } = useTranslation(['device_settings', 'branded'])
  const [showDocumentation, setShowDocumentation] = useState(false)

  const minLength =
    auditSettings?.minLengthOfReasonForInteraction ??
    MIN_LENGTH_OF_REASON_FOR_INTERACTION

  const documentationValue = auditSettings?.requireReasonForInteraction
    ? minLength > MIN_LENGTH_OF_REASON_FOR_INTERACTION
      ? `${minLength} ${t('odd_characters')}`
      : `${minLength} ${t('odd_character')}`
    : t('off')

  if (showDocumentation) {
    return (
      <RequireDocumentationSettings
        auditSettings={auditSettings}
        patchAuditSettings={patchAuditSettings}
        onClickBack={() => {
          setShowDocumentation(false)
        }}
      />
    )
  }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('odd_audit_log_requirements')}
        onClickBack={onClickBack}
      />
      <div className={styles.content}>
        <div className={styles.settings_list}>
          <SettingsListButton
            key={t('odd_require_documentation_for_robot_actions')}
            title={t('odd_require_documentation_for_robot_actions')}
            value={documentationValue}
            onClick={() => {
              setShowDocumentation(true)
            }}
            chevron
          />
          <ToggleSetting
            key={t('odd_require_signoff_for_protocol_log')}
            title={t('odd_require_signoff_for_protocol_log')}
            value={robotServerSettings?.requireSignoffForProtocolLog ?? false}
            onClick={() => {
              patchRobotServerSettings({
                requireSignoffForProtocolLog:
                  !robotServerSettings?.requireSignoffForProtocolLog,
              })
            }}
          />
          <ToggleSetting
            key={t('branded:require_logs_to_be_saved_in_app')}
            title={t('branded:require_logs_to_be_saved_in_app')}
            value={robotServerSettings?.requireLogsToBeSavedInApp ?? false}
            onClick={() => {
              patchRobotServerSettings({
                requireLogsToBeSavedInApp:
                  !robotServerSettings?.requireLogsToBeSavedInApp,
              })
            }}
            detail={t('odd_require_logs_to_be_saved_in_app_description')}
          />
        </div>
      </div>
    </div>
  )
}
