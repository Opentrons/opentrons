import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Divider, StyledText } from '@opentrons/components'
import {
  useAuditSettingsMutation,
  useAuditSettingsQuery,
  useAuthSettingsMutation,
  useAuthSettingsQuery,
  useGetRobotServerAccessControlSettingsQuery,
  usePatchRobotServerAccessControlSettingsMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import { Accordion } from './Accordion'
import {
  getAuditInputPatch,
  getAuthInputPatch,
  getFieldValuesFromSettings,
  isValidLogoutIdleTime,
  isValidPasswordComplexityMinimumLength,
  MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH,
} from './complianceReadySettingsHelper'
import {
  isAuditServerSettingKey,
  isAuthServerSettingKey,
  isRobotServerSettingKey,
} from './complianceReadySettingsTypes'
import styles from './compliancereadysoftwaresettings.module.css'
import { ComplianceReadyToggleField } from './ComplianceReadyToggleField'
import { InputSetting } from './InputSetting'

import type { JSX, ReactNode } from 'react'
import type {
  AuditServerSettingFieldId,
  AuthSettingFieldId,
  SettingFieldId,
} from './complianceReadySettingsTypes'

export type { UiSettingFieldId } from './complianceReadySettingsTypes'
export { UI_ONLY_FIELD_IDS } from './complianceReadySettingsTypes'

export interface ComplianceReadySoftwareSettingsProps {
  robotName: string
}

interface ComplianceReadySettingsSectionProps {
  titleKey: string
  isLastSection: boolean
  children: ReactNode
}

function ComplianceReadySettingsSection({
  titleKey,
  isLastSection,
  children,
}: ComplianceReadySettingsSectionProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  return (
    <div className={styles.section}>
      <StyledText desktopStyle="bodyDefaultSemiBold">{t(titleKey)}</StyledText>
      <div className={styles.field_list}>
        {children}
        {!isLastSection ? <Divider /> : null}
      </div>
    </div>
  )
}

export function ComplianceReadySoftwareSettings({
  robotName: _robotName,
}: ComplianceReadySoftwareSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const documentationState = useDocumentationState()
  const authSettingsQuery = useAuthSettingsQuery()
  const auditSettingsQuery = useAuditSettingsQuery()
  const robotServerAccessControlSettingsQuery =
    useGetRobotServerAccessControlSettingsQuery()
  const { mutate: patchAuthSettings } =
    useAuthSettingsMutation(documentationState)
  const { mutate: patchAuditSettings } =
    useAuditSettingsMutation(documentationState)
  const { mutate: patchRobotServerAccessControlSettings } =
    usePatchRobotServerAccessControlSettingsMutation(documentationState)

  const fieldValues = useMemo(
    () =>
      getFieldValuesFromSettings(
        authSettingsQuery.data?.data,
        robotServerAccessControlSettingsQuery.data?.data,
        auditSettingsQuery.data?.data
      ),
    [
      authSettingsQuery.data?.data,
      robotServerAccessControlSettingsQuery.data?.data,
      auditSettingsQuery.data?.data,
    ]
  )

  const handleAuthSettingInputBlur = (
    id: AuthSettingFieldId,
    value: string
  ): void => {
    const authPatch = getAuthInputPatch(id, value, fieldValues)
    if (authPatch != null) {
      patchAuthSettings(authPatch)
    }
  }

  const handleAuditSettingInputBlur = (
    id: AuditServerSettingFieldId,
    value: string
  ): void => {
    const auditPatch = getAuditInputPatch(id, value, fieldValues)
    if (auditPatch != null) {
      patchAuditSettings(auditPatch)
    }
  }

  const handleToggleChange = (
    fieldId: SettingFieldId,
    toggledOn: boolean
  ): void => {
    switch (fieldId) {
      case 'passwordResetEnabled':
        if (!toggledOn) {
          patchAuthSettings({ data: { passwordResetTime: null } })
        }
        return
      case 'passwordComplexityEnabled':
        if (!toggledOn) {
          patchAuthSettings({
            data: {
              passwordComplexitySpecialCharacters: null,
              passwordComplexityMinimumLength: null,
            },
          })
        }
        return
      default:
        if (isRobotServerSettingKey(fieldId)) {
          patchRobotServerAccessControlSettings({
            data: { [fieldId]: toggledOn },
          })
        } else if (isAuthServerSettingKey(fieldId)) {
          patchAuthSettings({ data: { [fieldId]: toggledOn } })
        } else if (isAuditServerSettingKey(fieldId)) {
          patchAuditSettings({ data: { [fieldId]: toggledOn } })
        }
    }
  }

  return (
    <Accordion
      id="compliance-ready-software-settings"
      title={t('desktop_compliance_ready_software_settings')}
    >
      <div className={styles.content}>
        <ComplianceReadySettingsSection
          titleKey="desktop_login_and_security"
          isLastSection={false}
        >
          <InputSetting
            key={String(fieldValues.maxNumberOfLoginAttempts)}
            label={t(
              'desktop_maximum_login_attempts_before_account_deactivation'
            )}
            value={String(fieldValues.maxNumberOfLoginAttempts)}
            units={t('desktop_logins')}
            onBlur={value => {
              handleAuthSettingInputBlur('maxNumberOfLoginAttempts', value)
            }}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="passwordResetEnabled"
            labelKey="desktop_require_password_change_after_time"
            values={fieldValues}
            onToggleChange={toggledOn => {
              handleToggleChange('passwordResetEnabled', toggledOn)
            }}
          >
            <InputSetting
              key={String(fieldValues.passwordResetTime)}
              label={t('desktop_length_of_time')}
              value={String(fieldValues.passwordResetTime)}
              units={t('desktop_days')}
              onBlur={value => {
                handleAuthSettingInputBlur('passwordResetTime', value)
              }}
            />
          </ComplianceReadyToggleField>
          <Divider />
          <ComplianceReadyToggleField
            id="passwordComplexityEnabled"
            labelKey="desktop_require_password_complexity_requirements"
            values={fieldValues}
            onToggleChange={toggledOn => {
              handleToggleChange('passwordComplexityEnabled', toggledOn)
            }}
          >
            <ComplianceReadyToggleField
              id="passwordComplexitySpecialCharacters"
              labelKey="desktop_require_special_characters"
              values={fieldValues}
              onToggleChange={toggledOn => {
                handleToggleChange(
                  'passwordComplexitySpecialCharacters',
                  toggledOn
                )
              }}
            />
            <InputSetting
              key={String(fieldValues.passwordComplexityMinimumLength)}
              label={t('desktop_minimum_password_length')}
              value={String(fieldValues.passwordComplexityMinimumLength)}
              units={t('desktop_characters')}
              min={1}
              max={MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH}
              validate={value =>
                isValidPasswordComplexityMinimumLength(value)
                  ? null
                  : t('desktop_minimum_password_length_invalid', {
                      max: MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH,
                    })
              }
              onBlur={value => {
                handleAuthSettingInputBlur(
                  'passwordComplexityMinimumLength',
                  value
                )
              }}
            />
          </ComplianceReadyToggleField>
          <Divider />
          <InputSetting
            key={String(fieldValues.idleLogout)}
            label={t('desktop_auto_logout_inactivity_length')}
            value={String(fieldValues.idleLogout)}
            units={t('desktop_minutes')}
            validate={value =>
              isValidLogoutIdleTime(value)
                ? null
                : t('desktop_idle_logout_must_be_greater_than_zero')
            }
            onBlur={value => {
              handleAuthSettingInputBlur('idleLogout', value)
            }}
          />
        </ComplianceReadySettingsSection>

        <ComplianceReadySettingsSection
          titleKey="desktop_actions_requiring_admin_credentials"
          isLastSection={false}
        >
          <ComplianceReadyToggleField
            id="requireAdminCredsWhenUpdatingRobotSoftware"
            labelKey="desktop_require_admin_credentials_to_update_robots"
            values={fieldValues}
            onToggleChange={toggledOn => {
              handleToggleChange(
                'requireAdminCredsWhenUpdatingRobotSoftware',
                toggledOn
              )
            }}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="requireAdminCredsWhenSendingProtocolToRobot"
            labelKey="desktop_require_admin_credentials_to_send_protocols"
            values={fieldValues}
            onToggleChange={toggledOn => {
              handleToggleChange(
                'requireAdminCredsWhenSendingProtocolToRobot',
                toggledOn
              )
            }}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="requireAdminCredsForSignoffProtocol"
            labelKey="desktop_require_admin_credentials_to_sign_protocol_run_records"
            values={fieldValues}
            onToggleChange={toggledOn => {
              handleToggleChange(
                'requireAdminCredsForSignoffProtocol',
                toggledOn
              )
            }}
          />
        </ComplianceReadySettingsSection>

        <ComplianceReadySettingsSection
          titleKey="desktop_audit_log_requirements"
          isLastSection={false}
        >
          <ComplianceReadyToggleField
            id="requireReasonForInteraction"
            labelKey="desktop_require_documentation_for_robot_actions"
            values={fieldValues}
            onToggleChange={toggledOn => {
              handleToggleChange('requireReasonForInteraction', toggledOn)
            }}
          >
            <InputSetting
              key={String(fieldValues.minLengthOfReasonForInteraction)}
              label={t(
                'desktop_minimum_length_for_documentation_for_robot_actions'
              )}
              value={String(fieldValues.minLengthOfReasonForInteraction)}
              units={t('desktop_characters')}
              onBlur={value => {
                handleAuditSettingInputBlur(
                  'minLengthOfReasonForInteraction',
                  value
                )
              }}
            />
          </ComplianceReadyToggleField>
          <Divider />
          <ComplianceReadyToggleField
            id="requireSignoffForProtocolLog"
            labelKey="desktop_require_signoff_for_protocol_log"
            values={fieldValues}
            onToggleChange={toggledOn => {
              handleToggleChange('requireSignoffForProtocolLog', toggledOn)
            }}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="requireLogsToBeSavedInApp"
            labelKey="desktop_require_logs_to_be_saved_in_app"
            detailKey="desktop_require_logs_to_be_saved_in_app_description"
            values={fieldValues}
            onToggleChange={toggledOn => {
              handleToggleChange('requireLogsToBeSavedInApp', toggledOn)
            }}
          />
        </ComplianceReadySettingsSection>
        <ComplianceReadySettingsSection
          titleKey="desktop_robot_storage"
          isLastSection
        >
          <ComplianceReadyToggleField
            id="deleteOverMaxOnDiskProtocols"
            labelKey="desktop_automatically_delete_protocol_run_logs"
            values={fieldValues}
            onToggleChange={toggledOn => {
              handleToggleChange('deleteOverMaxOnDiskProtocols', toggledOn)
            }}
          />
        </ComplianceReadySettingsSection>
      </div>
    </Accordion>
  )
}
