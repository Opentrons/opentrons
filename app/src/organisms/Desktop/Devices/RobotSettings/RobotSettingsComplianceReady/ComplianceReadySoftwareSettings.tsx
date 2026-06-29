import { useEffect, useState } from 'react'
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
  resolveComplianceReadyToggleChange,
} from './complianceReadySettingsHelper'
import styles from './compliancereadysoftwaresettings.module.css'
import { ComplianceReadyToggleField } from './ComplianceReadyToggleField'
import { InputSetting } from './InputSetting'

import type { JSX, ReactNode } from 'react'
import type {
  PatchAuthSettingsRequest,
  PatchRobotServerAccessControlSettingsRequest,
} from '@opentrons/api-client'
import type {
  AuthSettingFieldId,
  ComplianceReadyToggleFieldDescriptor,
  FieldValues,
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

const PASSWORD_RESET_TOGGLE: ComplianceReadyToggleFieldDescriptor = {
  id: 'passwordResetEnabled',
  children: ['passwordResetTime'],
}

const PASSWORD_COMPLEXITY_TOGGLE: ComplianceReadyToggleFieldDescriptor = {
  id: 'passwordComplexityEnabled',
  children: [
    'passwordComplexitySpecialCharacters',
    'passwordComplexityMinimumLength',
  ],
}

const REQUIRE_REASON_TOGGLE: ComplianceReadyToggleFieldDescriptor = {
  id: 'requireReasonForInteraction',
  children: ['minLengthOfReasonForInteraction'],
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
  const [fieldValues, setFieldValues] = useState<FieldValues>(() =>
    getFieldValuesFromSettings()
  )

  useEffect(() => {
    setFieldValues(
      getFieldValuesFromSettings(
        authSettingsQuery.data?.data,
        robotServerAccessControlSettingsQuery.data?.data
      )
    )
  }, [
    authSettingsQuery.data?.data,
    robotServerAccessControlSettingsQuery.data?.data,
  ])

  const patchAuth = (request: PatchAuthSettingsRequest): void => {
    patchAuthSettings(request, {
      onSuccess: response => {
        setFieldValues(
          getFieldValuesFromSettings(
            response.data,
            robotServerAccessControlSettingsQuery.data?.data
          )
        )
      },
    })
  }

  const patchRobotServerAccessControlSettingsRequest = (
    request: PatchRobotServerAccessControlSettingsRequest
  ): void => {
    patchRobotServerAccessControlSettings(request, {
      onSuccess: response => {
        setFieldValues(
          getFieldValuesFromSettings(
            authSettingsQuery.data?.data,
            response.data
          )
        )
      },
    })
  }

  const handleInputBlur = (
    id: AuthSettingFieldId,
    value: string,
    parentField?: ComplianceReadyToggleFieldDescriptor
  ): void => {
    const nextFieldValues: FieldValues = { ...fieldValues, [id]: value }
    setFieldValues(nextFieldValues)

    const authPatch = getAuthPatchForInputChange(
      id,
      value,
      fieldValues,
      parentField
    )
    if (authPatch != null) {
      patchAuth(authPatch)
    }
  }

  const handleToggleChange = (
    field: ComplianceReadyToggleFieldDescriptor,
    parentField?: ComplianceReadyToggleFieldDescriptor
  ): void => {
    const {
      fieldValues: nextFieldValues,
      authPatch,
      robotServerAccessControlPatch,
    } = resolveComplianceReadyToggleChange(field, fieldValues, parentField)
    setFieldValues(nextFieldValues)
    if (authPatch != null) {
      patchAuth(authPatch)
    } else if (robotServerAccessControlPatch != null) {
      patchRobotServerAccessControlSettingsRequest(
        robotServerAccessControlPatch
      )
    }
  }

  const toggleFieldProps = {
    values: fieldValues,
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
            key={String(fieldValues.maxNumberOfLoginAttempts)}
            label={t(
              'desktop_maximum_login_attempts_before_account_deactivation'
            )}
            value={String(fieldValues.maxNumberOfLoginAttempts)}
            units={t('desktop_logins')}
            onBlur={value => {
              handleInputBlur('maxNumberOfLoginAttempts', value)
            }}
          />
          <Divider />
          <ComplianceReadyToggleField
            id={PASSWORD_RESET_TOGGLE.id}
            labelKey="desktop_require_password_change_after_time"
            childFields={PASSWORD_RESET_TOGGLE.children}
            {...toggleFieldProps}
          >
            <InputSetting
              key={String(fieldValues.passwordResetTime)}
              label={t('desktop_length_of_time')}
              value={String(fieldValues.passwordResetTime)}
              units={t('desktop_days')}
              onBlur={value => {
                handleInputBlur(
                  'passwordResetTime',
                  value,
                  PASSWORD_RESET_TOGGLE
                )
              }}
            />
          </ComplianceReadyToggleField>
          <Divider />
          <ComplianceReadyToggleField
            id={PASSWORD_COMPLEXITY_TOGGLE.id}
            labelKey="desktop_require_password_complexity_requirements"
            childFields={PASSWORD_COMPLEXITY_TOGGLE.children}
            {...toggleFieldProps}
          >
            <ComplianceReadyToggleField
              id="passwordComplexitySpecialCharacters"
              labelKey="desktop_require_special_characters"
              parentField={PASSWORD_COMPLEXITY_TOGGLE}
              {...toggleFieldProps}
            />
            <InputSetting
              key={String(fieldValues.passwordComplexityMinimumLength)}
              label={t('desktop_minimum_password_length')}
              value={String(fieldValues.passwordComplexityMinimumLength)}
              units={t('desktop_characters')}
              onBlur={value => {
                handleInputBlur(
                  'passwordComplexityMinimumLength',
                  value,
                  PASSWORD_COMPLEXITY_TOGGLE
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
            id={REQUIRE_REASON_TOGGLE.id}
            labelKey="desktop_require_documentation_for_robot_actions"
            childFields={REQUIRE_REASON_TOGGLE.children}
            {...toggleFieldProps}
          >
            <InputSetting
              key={String(fieldValues.minLengthOfReasonForInteraction)}
              label={t(
                'desktop_minimum_length_for_documentation_for_robot_actions'
              )}
              value={String(fieldValues.minLengthOfReasonForInteraction)}
              units={t('desktop_characters')}
              onBlur={value => {
                handleInputBlur(
                  'minLengthOfReasonForInteraction',
                  value,
                  REQUIRE_REASON_TOGGLE
                )
              }}
            />
          </ComplianceReadyToggleField>
        </ComplianceReadySettingsSection>
      </div>
    </Accordion>
  )
}
