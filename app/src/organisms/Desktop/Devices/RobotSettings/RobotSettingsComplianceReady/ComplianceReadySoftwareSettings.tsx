import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Divider, StyledText } from '@opentrons/components'
import {
  useAccessControlSettingsQuery,
  useAuthSettingsQuery,
} from '@opentrons/react-api-client'

import { ToggleButton } from '/app/atoms/buttons'

import { Accordion } from './Accordion'
import styles from './compliancereadysoftwaresettings.module.css'
import { InputSetting } from './InputSetting'

import type { JSX } from 'react'
import {
  ACCESS_CONTROL_SETTING_KEYS,
  type AccessControlAppSettingsResponse,
  type AuthSettingsResponse,
} from '@opentrons/api-client'

export interface ComplianceReadySoftwareSettingsProps {
  robotName: string
}

type AuthSettingFieldId = keyof AuthSettingsResponse['data']

type RobotServerSettingFieldId = keyof AccessControlAppSettingsResponse['data']

export const UI_ONLY_FIELD_IDS = [
  'passwordResetEnabled',
  'passwordComplexityEnabled',
] as const

type UiSettingFieldId = (typeof UI_ONLY_FIELD_IDS)[number]

type SettingFieldId =
  | AuthSettingFieldId
  | UiSettingFieldId
  | RobotServerSettingFieldId

type FieldValues = Record<SettingFieldId, string | boolean>

interface InputFieldConfig {
  type: 'input'
  id: AuthSettingFieldId
  labelKey: string
  unitsKey?: string
}

interface ToggleFieldConfig {
  type: 'toggle'
  id: SettingFieldId
  labelKey: string
  children?: Array<InputFieldConfig | ToggleFieldConfig>
}

type ComplianceReadyFieldConfig = InputFieldConfig | ToggleFieldConfig

interface ComplianceReadySettingsSectionConfig {
  titleKey: string
  fields: ComplianceReadyFieldConfig[]
}

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60

const authSettingsFieldDefaults = {
  maxNumberOfLoginAttempts: null,
  passwordResetTime: null,
  passwordComplexityMinimumLength: null,
  passwordComplexitySpecialCharacters: false,
  idleLogout: 0,
  requireReasonForInteraction: false,
  minLengthOfReasonForInteraction: null,
  requireAdminCredsWhenUpdatingRobotSoftware: false,
  requireAdminCredsWhenSendingProtocolToRobot: false,
  requireAdminCredsForSignoffProtocol: false,
} satisfies AuthSettingsResponse['data']

const AUTH_SETTING_KEYS = Object.keys(
  authSettingsFieldDefaults
) as Array<keyof typeof authSettingsFieldDefaults>

function getAuthSettingFieldValue(
  key: keyof typeof authSettingsFieldDefaults,
  authSettings?: AuthSettingsResponse['data']
): string | boolean {
  if (authSettings == null) {
    return typeof authSettingsFieldDefaults[key] === 'boolean' ? false : ''
  }

  switch (key) {
    case 'idleLogout':
      return String(Math.round(authSettings.idleLogout / SECONDS_PER_MINUTE))
    case 'passwordResetTime':
      return authSettings.passwordResetTime != null
        ? String(Math.round(authSettings.passwordResetTime / SECONDS_PER_DAY))
        : ''
    default: {
      const value = authSettings[key]
      if (typeof value === 'boolean') {
        return value
      }
      return value != null ? String(value) : ''
    }
  }
}

function getAuthFieldValues(
  authSettings?: AuthSettingsResponse['data']
): Pick<FieldValues, AuthSettingFieldId> {
  return AUTH_SETTING_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: getAuthSettingFieldValue(key, authSettings),
    }),
    {} as Pick<FieldValues, AuthSettingFieldId>
  )
}

function getRobotServerFieldValues(
  robotSettings?: AccessControlAppSettingsResponse['data']
): Pick<FieldValues, RobotServerSettingFieldId> {
  return ACCESS_CONTROL_SETTING_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: robotSettings?.[key] ?? false,
    }),
    {} as Pick<FieldValues, RobotServerSettingFieldId>
  )
}

function getFieldValuesFromSettings(
  authSettings?: AuthSettingsResponse['data'],
  robotSettings?: AccessControlAppSettingsResponse['data']
): FieldValues {
  return {
    ...getAuthFieldValues(authSettings),
    passwordResetEnabled: authSettings?.passwordResetTime != null,
    passwordComplexityEnabled:
      authSettings != null
        ? authSettings.passwordComplexityMinimumLength != null ||
          authSettings.passwordComplexitySpecialCharacters
        : false,
    ...getRobotServerFieldValues(robotSettings),
  }
}

export const SETTINGS_SECTIONS: ComplianceReadySettingsSectionConfig[] = [
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
        id: 'requireSignoffForProtocolLog',
        labelKey: 'desktop_require_signoff_for_protocol_log',
      },
      // TODO(tz, 2026-06-22): i dont see it in the design, but it is in the api
      // {
      //   type: 'toggle',
      //   id: 'requireLogsToBeSavedInApp',
      //   labelKey: 'desktop_require_logs_saved_in_app',
      // },
      {
        type: 'toggle',
        id: 'deleteOverMaxOnDiskProtocols',
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
  const { t } = useTranslation('device_settings')

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
      {toggledOn ? (
        <div className={styles.sub_fields}>
          {field.children.map(child => (
            <ComplianceReadySettingField
              key={child.id}
              field={child}
              values={values}
              onInputChange={onInputChange}
              onToggleChange={onToggleChange}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface ComplianceReadySettingsSectionProps {
  section: ComplianceReadySettingsSectionConfig
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
  const { t } = useTranslation('device_settings')

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
  const { t } = useTranslation('device_settings')
  const authSettingsQuery = useAuthSettingsQuery()
  const accessControlSettingsQuery = useAccessControlSettingsQuery()
  const [fieldValues, setFieldValues] = useState<FieldValues>(() =>
    getFieldValuesFromSettings()
  )

  useEffect(() => {
    setFieldValues(
      getFieldValuesFromSettings(
        authSettingsQuery.data?.data,
        accessControlSettingsQuery.data?.data
      )
    )
  }, [authSettingsQuery.data?.data, accessControlSettingsQuery.data?.data])

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
    <Accordion
      id="compliance-ready-software-settings"
      title={t('desktop_compliance_ready_software_settings')}
    >
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
