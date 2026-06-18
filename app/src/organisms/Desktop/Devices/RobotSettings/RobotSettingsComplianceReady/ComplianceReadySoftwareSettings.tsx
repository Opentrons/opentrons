import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Divider, StyledText } from '@opentrons/components'
import { useAuthSettingsQuery } from '@opentrons/react-api-client'

import { ToggleButton } from '/app/atoms/buttons'
import { Accordion } from '/app/molecules/Accordion'
import { InputSetting } from '/app/molecules/InputSetting'

import styles from './compliancereadysoftwaresettings.module.css'

import type { JSX } from 'react'
import type { AuthSettingsResponse } from '@opentrons/api-client'

export interface ComplianceReadySoftwareSettingsProps {
  robotName: string
}

type AuthSettingFieldId = keyof AuthSettingsResponse['data']

export const UI_ONLY_FIELD_IDS = [
  'passwordResetEnabled',
  'passwordComplexityEnabled',
  'requireProtocolLogsSignedAndSaved',
  'automaticallyDeleteProtocolRunLogs',
] as const

type UiSettingFieldId = (typeof UI_ONLY_FIELD_IDS)[number]

type SettingFieldId = AuthSettingFieldId | UiSettingFieldId

type FieldValues = Record<SettingFieldId, string | boolean>

type InputFieldConfig = {
  type: 'input'
  id: AuthSettingFieldId
  labelKey: string
  unitsKey?: string
}

type ToggleFieldConfig = {
  type: 'toggle'
  id: SettingFieldId
  labelKey: string
  children?: Array<InputFieldConfig | ToggleFieldConfig>
}

type ComplianceReadyFieldConfig = InputFieldConfig | ToggleFieldConfig

type ComplianceReadySettingsSection = {
  titleKey: string
  fields: ComplianceReadyFieldConfig[]
}

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60

function getFieldValuesFromAuthSettings(
  settings?: AuthSettingsResponse['data']
): FieldValues {
  return {
    maxNumberOfLoginAttempts:
      settings?.maxNumberOfLoginAttempts != null
        ? String(settings.maxNumberOfLoginAttempts)
        : '',
    idleLogout:
      settings != null
        ? String(Math.round(settings.idleLogout / SECONDS_PER_MINUTE))
        : '',
    passwordResetEnabled: settings?.passwordResetTime != null,
    passwordResetTime:
      settings?.passwordResetTime != null
        ? String(Math.round(settings.passwordResetTime / SECONDS_PER_DAY))
        : '',
    passwordComplexityEnabled:
      settings != null
        ? settings.passwordComplexityMinimumLength != null ||
          settings.passwordComplexitySpecialCharacters
        : false,
    passwordComplexitySpecialCharacters:
      settings?.passwordComplexitySpecialCharacters ?? false,
    passwordComplexityMinimumLength:
      settings?.passwordComplexityMinimumLength != null
        ? String(settings.passwordComplexityMinimumLength)
        : '',
    requireAdminCredsWhenUpdatingRobotSoftware:
      settings?.requireAdminCredsWhenUpdatingRobotSoftware ?? false,
    requireAdminCredsWhenSendingProtocolToRobot:
      settings?.requireAdminCredsWhenSendingProtocolToRobot ?? false,
    requireAdminCredsForSignoffProtocol:
      settings?.requireAdminCredsForSignoffProtocol ?? false,
    requireReasonForInteraction: settings?.requireReasonForInteraction ?? false,
    minLengthOfReasonForInteraction:
      settings?.minLengthOfReasonForInteraction != null
        ? String(settings.minLengthOfReasonForInteraction)
        : '',
    requireProtocolLogsSignedAndSaved: false,
    automaticallyDeleteProtocolRunLogs: false,
  }
}

export const SETTINGS_SECTIONS: ComplianceReadySettingsSection[] = [
  {
    titleKey: 'desktop_login_and_security',
    fields: [
      {
        type: 'input',
        id: 'maxNumberOfLoginAttempts',
        labelKey: 'desktop_maximum_login_attempts_before_account_deactivation',
        unitsKey: 'desktop_logins',
      },
      {
        type: 'toggle',
        id: 'passwordResetEnabled',
        labelKey: 'desktop_require_password_change_after_time',
        children: [
          {
            type: 'input',
            id: 'passwordResetTime',
            labelKey: 'desktop_length_of_time',
            unitsKey: 'desktop_days',
          },
        ],
      },
      {
        type: 'toggle',
        id: 'passwordComplexityEnabled',
        labelKey: 'desktop_require_password_complexity_requirements',
        children: [
          {
            type: 'toggle',
            id: 'passwordComplexitySpecialCharacters',
            labelKey: 'desktop_require_special_characters',
          },
          {
            type: 'input',
            id: 'passwordComplexityMinimumLength',
            labelKey: 'desktop_minimum_password_length',
            unitsKey: 'desktop_characters',
          },
        ],
      },
      {
        type: 'input',
        id: 'idleLogout',
        labelKey: 'desktop_auto_logout_inactivity_length',
        unitsKey: 'desktop_minutes',
      },
    ],
  },
  {
    titleKey: 'desktop_actions_requiring_admin_credentials',
    fields: [
      {
        type: 'toggle',
        id: 'requireAdminCredsWhenUpdatingRobotSoftware',
        labelKey: 'desktop_require_admin_credentials_to_update_robots',
      },
      {
        type: 'toggle',
        id: 'requireAdminCredsWhenSendingProtocolToRobot',
        labelKey: 'desktop_require_admin_credentials_to_send_protocols',
      },
      {
        type: 'toggle',
        id: 'requireAdminCredsForSignoffProtocol',
        labelKey:
          'desktop_require_admin_credentials_to_sign_protocol_run_records',
      },
    ],
  },
  {
    titleKey: 'desktop_protocol_logs',
    fields: [
      {
        type: 'toggle',
        id: 'requireProtocolLogsSignedAndSaved',
        labelKey: 'desktop_require_protocol_logs_signed_and_saved',
      },
      {
        type: 'toggle',
        id: 'automaticallyDeleteProtocolRunLogs',
        labelKey: 'desktop_automatically_delete_protocol_run_logs',
      },
    ],
  },
  {
    titleKey: 'desktop_audit_log_requirements',
    fields: [
      {
        type: 'toggle',
        id: 'requireReasonForInteraction',
        labelKey: 'desktop_require_documentation_for_robot_actions',
        children: [
          {
            type: 'input',
            id: 'minLengthOfReasonForInteraction',
            labelKey:
              'desktop_minimum_length_for_documentation_for_robot_actions',
            unitsKey: 'desktop_characters',
          },
        ],
      },
    ],
  },
]

interface ComplianceReadySettingFieldProps {
  field: ComplianceReadyFieldConfig
  values: FieldValues
  onInputChange: (id: AuthSettingFieldId, value: string) => void
  onToggleChange: (id: SettingFieldId) => void
}

function ComplianceReadySettingField({
  field,
  values,
  onInputChange,
  onToggleChange,
}: ComplianceReadySettingFieldProps): JSX.Element {
  const { t } = useTranslation('access_control')

  if (field.type === 'input') {
    return (
      <InputSetting
        id={field.id}
        label={t(field.labelKey)}
        value={String(values[field.id])}
        units={field.unitsKey != null ? t(field.unitsKey) : undefined}
        onChange={event => {
          onInputChange(field.id, event.target.value)
        }}
      />
    )
  }

  const toggledOn = Boolean(values[field.id])
  const label = t(field.labelKey)

  const toggleRow = (
    <div className={styles.toggle_row}>
      <StyledText
        desktopStyle="bodyDefaultRegular"
        className={styles.toggle_label}
      >
        {label}
      </StyledText>
      <ToggleButton
        id={field.id}
        label={label}
        toggledOn={toggledOn}
        onClick={() => {
          onToggleChange(field.id)
        }}
      />
    </div>
  )

  if (field.children == null) {
    return toggleRow
  }

  return (
    <div className={styles.toggle_setting}>
      {toggleRow}
      {toggledOn
        ? field.children.map(child => (
            <ComplianceReadySettingField
              key={child.id}
              field={child}
              values={values}
              onInputChange={onInputChange}
              onToggleChange={onToggleChange}
            />
          ))
        : null}
    </div>
  )
}

interface ComplianceReadySettingsSectionProps {
  section: ComplianceReadySettingsSection
  isLastSection: boolean
  values: FieldValues
  onInputChange: (id: AuthSettingFieldId, value: string) => void
  onToggleChange: (id: SettingFieldId) => void
}

function ComplianceReadySettingsSection({
  section,
  isLastSection,
  values,
  onInputChange,
  onToggleChange,
}: ComplianceReadySettingsSectionProps): JSX.Element {
  const { t } = useTranslation('access_control')

  return (
    <div className={styles.section}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t(section.titleKey)}
      </StyledText>
      <div className={styles.field_list}>
        {section.fields.map((field, index) => (
          <Fragment key={field.id}>
            <ComplianceReadySettingField
              field={field}
              values={values}
              onInputChange={onInputChange}
              onToggleChange={onToggleChange}
            />
            {index < section.fields.length - 1 || !isLastSection ? (
              <Divider />
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export function ComplianceReadySoftwareSettings({
  robotName: _robotName,
}: ComplianceReadySoftwareSettingsProps): JSX.Element {
  const { t } = useTranslation('access_control')
  const authSettingsQuery = useAuthSettingsQuery()
  const [fieldValues, setFieldValues] = useState<FieldValues>(() =>
    getFieldValuesFromAuthSettings()
  )

  useEffect(() => {
    if (authSettingsQuery.data?.data != null) {
      setFieldValues(getFieldValuesFromAuthSettings(authSettingsQuery.data.data))
    }
  }, [authSettingsQuery.data?.data])

  const handleInputChange = (id: AuthSettingFieldId, value: string): void => {
    setFieldValues(current => ({
      ...current,
      [id]: value,
    }))
  }

  const handleToggleChange = (id: SettingFieldId): void => {
    setFieldValues(current => ({
      ...current,
      [id]: !current[id],
    }))
  }

  return (
    <Accordion title={t('desktop_compliance_ready_software_settings')}>
      <div className={styles.content}>
        {SETTINGS_SECTIONS.map((section, index) => (
          <ComplianceReadySettingsSection
            key={section.titleKey}
            section={section}
            isLastSection={index === SETTINGS_SECTIONS.length - 1}
            values={fieldValues}
            onInputChange={handleInputChange}
            onToggleChange={handleToggleChange}
          />
        ))}
      </div>
    </Accordion>
  )
}
