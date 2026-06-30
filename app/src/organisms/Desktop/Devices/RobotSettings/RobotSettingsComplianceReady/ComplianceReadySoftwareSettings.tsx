import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Divider, StyledText } from '@opentrons/components'
import {
  useAuthSettingsMutation,
  useAuthSettingsQuery,
  useGetRobotServerAccessControlSettingsQuery,
  usePatchRobotServerAccessControlSettingsMutation,
} from '@opentrons/react-api-client'

import { Accordion } from './Accordion'
import {
  getAuthInputPatch,
  getFieldValuesFromSettings,
} from './complianceReadySettingsHelper'
import {
  isAuthServerSettingKey,
  isRobotServerSettingKey,
} from './complianceReadySettingsTypes'
import styles from './compliancereadysoftwaresettings.module.css'
import { ComplianceReadyToggleField } from './ComplianceReadyToggleField'
import { InputSetting } from './InputSetting'

import type { JSX, ReactNode } from 'react'
import type {
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
  const authSettingsQuery = useAuthSettingsQuery()
  const robotServerAccessControlSettingsQuery =
    useGetRobotServerAccessControlSettingsQuery()
  const { patchAuthSettings } = useAuthSettingsMutation()
  const { patchRobotServerAccessControlSettings } =
    usePatchRobotServerAccessControlSettingsMutation()

  const fieldValues = useMemo(
    () =>
      getFieldValuesFromSettings(
        authSettingsQuery.data?.data,
        robotServerAccessControlSettingsQuery.data?.data
      ),
    [
      authSettingsQuery.data?.data,
      robotServerAccessControlSettingsQuery.data?.data,
    ]
  )

  const handleInputBlur =
    (id: AuthSettingFieldId) =>
    (value: string): void => {
      const authPatch = getAuthInputPatch(id, value, fieldValues)
      if (authPatch != null) {
        void patchAuthSettings(authPatch)
      }
    }

  const handleToggleChange =
    (fieldId: SettingFieldId) =>
    (toggledOn: boolean): void => {
      switch (fieldId) {
        case 'passwordResetEnabled':
          if (!toggledOn) {
            void patchAuthSettings({ data: { passwordResetTime: null } })
          }
          return
        case 'passwordComplexityEnabled':
          if (!toggledOn) {
            void patchAuthSettings({
              data: {
                passwordComplexitySpecialCharacters: null,
                passwordComplexityMinimumLength: null,
              },
            })
          }
          return
        default:
          if (isRobotServerSettingKey(fieldId)) {
            void patchRobotServerAccessControlSettings({
              data: { [fieldId]: toggledOn },
            })
          } else if (isAuthServerSettingKey(fieldId)) {
            void patchAuthSettings({ data: { [fieldId]: toggledOn } })
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
            onBlur={handleInputBlur('maxNumberOfLoginAttempts')}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="passwordResetEnabled"
            labelKey="desktop_require_password_change_after_time"
            values={fieldValues}
            onToggleChange={handleToggleChange('passwordResetEnabled')}
          >
            <InputSetting
              key={String(fieldValues.passwordResetTime)}
              label={t('desktop_length_of_time')}
              value={String(fieldValues.passwordResetTime)}
              units={t('desktop_days')}
              onBlur={handleInputBlur('passwordResetTime')}
            />
          </ComplianceReadyToggleField>
          <Divider />
          <ComplianceReadyToggleField
            id="passwordComplexityEnabled"
            labelKey="desktop_require_password_complexity_requirements"
            values={fieldValues}
            onToggleChange={handleToggleChange('passwordComplexityEnabled')}
          >
            <ComplianceReadyToggleField
              id="passwordComplexitySpecialCharacters"
              labelKey="desktop_require_special_characters"
              values={fieldValues}
              onToggleChange={handleToggleChange(
                'passwordComplexitySpecialCharacters'
              )}
            />
            <InputSetting
              key={String(fieldValues.passwordComplexityMinimumLength)}
              label={t('desktop_minimum_password_length')}
              value={String(fieldValues.passwordComplexityMinimumLength)}
              units={t('desktop_characters')}
              onBlur={handleInputBlur('passwordComplexityMinimumLength')}
            />
          </ComplianceReadyToggleField>
          <Divider />
          <InputSetting
            key={String(fieldValues.idleLogout)}
            label={t('desktop_auto_logout_inactivity_length')}
            value={String(fieldValues.idleLogout)}
            units={t('desktop_minutes')}
            onBlur={handleInputBlur('idleLogout')}
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
            onToggleChange={handleToggleChange(
              'requireAdminCredsWhenUpdatingRobotSoftware'
            )}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="requireAdminCredsWhenSendingProtocolToRobot"
            labelKey="desktop_require_admin_credentials_to_send_protocols"
            values={fieldValues}
            onToggleChange={handleToggleChange(
              'requireAdminCredsWhenSendingProtocolToRobot'
            )}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="requireAdminCredsForSignoffProtocol"
            labelKey="desktop_require_admin_credentials_to_sign_protocol_run_records"
            values={fieldValues}
            onToggleChange={handleToggleChange(
              'requireAdminCredsForSignoffProtocol'
            )}
          />
        </ComplianceReadySettingsSection>

        <ComplianceReadySettingsSection
          titleKey="desktop_protocol_logs"
          isLastSection={false}
        >
          <ComplianceReadyToggleField
            id="requireSignoffForProtocolLog"
            labelKey="desktop_require_signoff_for_protocol_log"
            values={fieldValues}
            onToggleChange={handleToggleChange('requireSignoffForProtocolLog')}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="deleteOverMaxOnDiskProtocols"
            labelKey="desktop_automatically_delete_protocol_run_logs"
            values={fieldValues}
            onToggleChange={handleToggleChange('deleteOverMaxOnDiskProtocols')}
          />
        </ComplianceReadySettingsSection>

        <ComplianceReadySettingsSection
          titleKey="desktop_audit_log_requirements"
          isLastSection
        >
          <ComplianceReadyToggleField
            id="requireReasonForInteraction"
            labelKey="desktop_require_documentation_for_robot_actions"
            values={fieldValues}
            onToggleChange={handleToggleChange('requireReasonForInteraction')}
          >
            <InputSetting
              key={String(fieldValues.minLengthOfReasonForInteraction)}
              label={t(
                'desktop_minimum_length_for_documentation_for_robot_actions'
              )}
              value={String(fieldValues.minLengthOfReasonForInteraction)}
              units={t('desktop_characters')}
              onBlur={handleInputBlur('minLengthOfReasonForInteraction')}
            />
          </ComplianceReadyToggleField>
        </ComplianceReadySettingsSection>
      </div>
    </Accordion>
  )
}
