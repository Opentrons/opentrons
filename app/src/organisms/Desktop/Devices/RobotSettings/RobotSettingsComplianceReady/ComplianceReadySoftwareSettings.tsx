import { useMemo, useState } from 'react'
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
  getAuthPatchForInputChange,
  getFieldValuesFromSettings,
} from './complianceReadySettingsHelper'
import {
  isAuthServerSettingKey,
  isRobotServerSettingKey,
  isUiOnlyFieldId,
} from './complianceReadySettingsTypes'
import styles from './compliancereadysoftwaresettings.module.css'
import { ComplianceReadyToggleField } from './ComplianceReadyToggleField'
import { InputSetting } from './InputSetting'

import type { JSX, ReactNode } from 'react'
import type { PatchAuthSettingsRequest } from '@opentrons/api-client'
import type {
  AuthSettingFieldId,
  ComplianceReadyToggleChangeOptions,
  SettingFieldId,
  UiSettingFieldId,
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

  const [uiOnlyFieldValues, setUiOnlyFieldValues] = useState<
    Partial<Record<UiSettingFieldId, boolean>>
  >({})

  const values = useMemo(
    () => ({ ...fieldValues, ...uiOnlyFieldValues }),
    [fieldValues, uiOnlyFieldValues]
  )

  const handleInputBlur = (
    id: AuthSettingFieldId,
    value: string,
    parentFieldId?: SettingFieldId
  ): void => {
    const authPatch = getAuthPatchForInputChange(
      id,
      value,
      values,
      parentFieldId
    )
    if (authPatch != null) {
      void patchAuthSettings(authPatch)
    }
  }

  const handleToggleChange = (
    fieldId: SettingFieldId,
    options?: ComplianceReadyToggleChangeOptions
  ): void => {
    const toggledOn = !Boolean(values[fieldId])
    const { parentFieldId, childFieldIds } = options ?? {}

    if (isUiOnlyFieldId(fieldId)) {
      setUiOnlyFieldValues(prev => ({
        ...prev,
        [fieldId]: toggledOn,
      }))

      if (!toggledOn && childFieldIds != null) {
        const authData: PatchAuthSettingsRequest['data'] = {}

        for (const childId of childFieldIds) {
          if (isAuthServerSettingKey(childId)) {
            authData[childId] = null
          }
        }

        if (Object.keys(authData).length > 0) {
          void patchAuthSettings({ data: authData })
        }
      }
    } else if (parentFieldId != null) {
      void patchAuthSettings({ data: { [fieldId]: toggledOn } })
    } else if (isRobotServerSettingKey(fieldId)) {
      void patchRobotServerAccessControlSettings({
        data: { [fieldId]: toggledOn },
      })
    } else if (isAuthServerSettingKey(fieldId)) {
      void patchAuthSettings({ data: { [fieldId]: toggledOn } })
    }
  }

  const toggleFieldProps = {
    values,
    onToggleChange: handleToggleChange,
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
            key={String(values.maxNumberOfLoginAttempts)}
            label={t(
              'desktop_maximum_login_attempts_before_account_deactivation'
            )}
            value={String(values.maxNumberOfLoginAttempts)}
            units={t('desktop_logins')}
            onBlur={value => {
              handleInputBlur('maxNumberOfLoginAttempts', value)
            }}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="passwordResetEnabled"
            labelKey="desktop_require_password_change_after_time"
            childFieldIds={['passwordResetTime']}
            {...toggleFieldProps}
          >
            <InputSetting
              key={String(values.passwordResetTime)}
              label={t('desktop_length_of_time')}
              value={String(values.passwordResetTime)}
              units={t('desktop_days')}
              onBlur={value => {
                handleInputBlur(
                  'passwordResetTime',
                  value,
                  'passwordResetEnabled'
                )
              }}
            />
          </ComplianceReadyToggleField>
          <Divider />
          <ComplianceReadyToggleField
            id="passwordComplexityEnabled"
            labelKey="desktop_require_password_complexity_requirements"
            childFieldIds={[
              'passwordComplexitySpecialCharacters',
              'passwordComplexityMinimumLength',
            ]}
            {...toggleFieldProps}
          >
            <ComplianceReadyToggleField
              id="passwordComplexitySpecialCharacters"
              labelKey="desktop_require_special_characters"
              parentFieldId="passwordComplexityEnabled"
              {...toggleFieldProps}
            />
            <InputSetting
              key={String(values.passwordComplexityMinimumLength)}
              label={t('desktop_minimum_password_length')}
              value={String(values.passwordComplexityMinimumLength)}
              units={t('desktop_characters')}
              onBlur={value => {
                handleInputBlur(
                  'passwordComplexityMinimumLength',
                  value,
                  'passwordComplexityEnabled'
                )
              }}
            />
          </ComplianceReadyToggleField>
          <Divider />
          <InputSetting
            key={String(values.idleLogout)}
            label={t('desktop_auto_logout_inactivity_length')}
            value={String(values.idleLogout)}
            units={t('desktop_minutes')}
            onBlur={value => {
              handleInputBlur('idleLogout', value)
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
            {...toggleFieldProps}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="requireAdminCredsWhenSendingProtocolToRobot"
            labelKey="desktop_require_admin_credentials_to_send_protocols"
            {...toggleFieldProps}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="requireAdminCredsForSignoffProtocol"
            labelKey="desktop_require_admin_credentials_to_sign_protocol_run_records"
            {...toggleFieldProps}
          />
        </ComplianceReadySettingsSection>

        <ComplianceReadySettingsSection
          titleKey="desktop_protocol_logs"
          isLastSection={false}
        >
          <ComplianceReadyToggleField
            id="requireSignoffForProtocolLog"
            labelKey="desktop_require_signoff_for_protocol_log"
            {...toggleFieldProps}
          />
          <Divider />
          <ComplianceReadyToggleField
            id="deleteOverMaxOnDiskProtocols"
            labelKey="desktop_automatically_delete_protocol_run_logs"
            {...toggleFieldProps}
          />
        </ComplianceReadySettingsSection>

        <ComplianceReadySettingsSection
          titleKey="desktop_audit_log_requirements"
          isLastSection
        >
          <ComplianceReadyToggleField
            id="requireReasonForInteraction"
            labelKey="desktop_require_documentation_for_robot_actions"
            {...toggleFieldProps}
          >
            <InputSetting
              key={String(values.minLengthOfReasonForInteraction)}
              label={t(
                'desktop_minimum_length_for_documentation_for_robot_actions'
              )}
              value={String(values.minLengthOfReasonForInteraction)}
              units={t('desktop_characters')}
              onBlur={value => {
                handleInputBlur(
                  'minLengthOfReasonForInteraction',
                  value,
                  'requireReasonForInteraction'
                )
              }}
            />
          </ComplianceReadyToggleField>
        </ComplianceReadySettingsSection>
      </div>
    </Accordion>
  )
}
