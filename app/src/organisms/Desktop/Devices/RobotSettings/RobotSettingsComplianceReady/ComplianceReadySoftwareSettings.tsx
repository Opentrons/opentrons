import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Divider, StyledText } from '@opentrons/components'

import { ToggleButton } from '/app/atoms/buttons'
import { Accordion } from '/app/molecules/Accordion'
import { InputSetting } from '/app/molecules/InputSetting'

import styles from './compliancereadysoftwaresettings.module.css'

import type { JSX } from 'react'

export interface ComplianceReadySoftwareSettingsProps {
  robotName: string
}

type FieldId =
  | 'loginAttempts'
  | 'autoLogoutMinutes'
  | 'requirePasswordChange'
  | 'passwordChangeDays'
  | 'requirePasswordComplexity'
  | 'requireSpecialCharacters'
  | 'minimumPasswordLength'
  | 'requireAdminCredentialsToUpdateRobots'
  | 'requireAdminCredentialsToSendProtocols'
  | 'requireAdminCredentialsToSignRunRecords'
  | 'requireProtocolLogsSignedAndSaved'
  | 'automaticallyDeleteProtocolRunLogs'

type FieldValues = Record<FieldId, string | boolean>

type InputFieldConfig = {
  type: 'input'
  id: FieldId
  labelKey: string
  unitsKey?: string
}

type ToggleFieldConfig = {
  type: 'toggle'
  id: FieldId
  labelKey: string
  children?: Array<InputFieldConfig | ToggleFieldConfig>
}

type ComplianceReadyFieldConfig = InputFieldConfig | ToggleFieldConfig

type ComplianceReadySettingsSection = {
  titleKey: string
  fields: ComplianceReadyFieldConfig[]
}

const INITIAL_FIELD_VALUES: FieldValues = {
  loginAttempts: '',
  autoLogoutMinutes: '',
  requirePasswordChange: false,
  passwordChangeDays: '',
  requirePasswordComplexity: false,
  requireSpecialCharacters: false,
  minimumPasswordLength: '',
  requireAdminCredentialsToUpdateRobots: false,
  requireAdminCredentialsToSendProtocols: false,
  requireAdminCredentialsToSignRunRecords: false,
  requireProtocolLogsSignedAndSaved: false,
  automaticallyDeleteProtocolRunLogs: false,
}

const SETTINGS_SECTIONS: ComplianceReadySettingsSection[] = [
  {
    titleKey: 'desktop_login_and_security',
    fields: [
      {
        type: 'input',
        id: 'loginAttempts',
        labelKey:
          'desktop_maximum_login_attempts_before_account_deactivation',
        unitsKey: 'desktop_logins',
      },
      {
        type: 'toggle',
        id: 'requirePasswordChange',
        labelKey: 'desktop_require_password_change_after_time',
        children: [
          {
            type: 'input',
            id: 'passwordChangeDays',
            labelKey: 'desktop_length_of_time',
            unitsKey: 'desktop_days',
          },
        ],
      },
      {
        type: 'toggle',
        id: 'requirePasswordComplexity',
        labelKey: 'desktop_require_password_complexity_requirements',
        children: [
          {
            type: 'toggle',
            id: 'requireSpecialCharacters',
            labelKey: 'desktop_require_special_characters',
          },
          {
            type: 'input',
            id: 'minimumPasswordLength',
            labelKey: 'desktop_minimum_password_length',
            unitsKey: 'desktop_characters',
          },
        ],
      },
      {
        type: 'input',
        id: 'autoLogoutMinutes',
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
        id: 'requireAdminCredentialsToUpdateRobots',
        labelKey: 'desktop_require_admin_credentials_to_update_robots',
      },
      {
        type: 'toggle',
        id: 'requireAdminCredentialsToSendProtocols',
        labelKey: 'desktop_require_admin_credentials_to_send_protocols',
      },
      {
        type: 'toggle',
        id: 'requireAdminCredentialsToSignRunRecords',
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
]

interface ComplianceReadySettingFieldProps {
  field: ComplianceReadyFieldConfig
  values: FieldValues
  onInputChange: (id: FieldId, value: string) => void
  onToggleChange: (id: FieldId) => void
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
      <div className={styles.toggle_button}>
        <ToggleButton
          label={label}
          toggledOn={toggledOn}
          onClick={() => {
            onToggleChange(field.id)
          }}
        />
      </div>
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
  onInputChange: (id: FieldId, value: string) => void
  onToggleChange: (id: FieldId) => void
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
  const [fieldValues, setFieldValues] =
    useState<FieldValues>(INITIAL_FIELD_VALUES)

  const handleInputChange = (id: FieldId, value: string): void => {
    setFieldValues(current => ({
      ...current,
      [id]: value,
    }))
  }

  const handleToggleChange = (id: FieldId): void => {
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
