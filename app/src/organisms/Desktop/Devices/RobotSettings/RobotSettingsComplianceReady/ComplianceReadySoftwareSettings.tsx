import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ACCESS_CONTROL_SETTING_KEYS } from '@opentrons/api-client'
import { Divider, StyledText } from '@opentrons/components'
import {
  useAccessControlSettingsQuery,
  useAuthSettingsQuery,
  useAuthSettingsMutation,
  usePatchAccessControlSettingsMutation,
} from '@opentrons/react-api-client'

import { ToggleButton } from '/app/atoms/buttons'

import { Accordion } from './Accordion'
import styles from './compliancereadysoftwaresettings.module.css'
import { InputSetting } from './InputSetting'

import type { JSX } from 'react'
import type {
  AccessControlAppSettingsResponse,
  AuthSettingsResponse,
  PatchAccessControlSettingsRequest,
  PatchAuthSettingsRequest,
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

type SettingFieldId = AuthSettingFieldId | UiSettingFieldId | RobotServerSettingFieldId

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

function isUiOnlyFieldId(id: SettingFieldId): id is UiSettingFieldId {
  return (UI_ONLY_FIELD_IDS as readonly string[]).includes(id)
}

function isAuthSettingFieldId(id: SettingFieldId): id is AuthSettingFieldId {
  return !isUiOnlyFieldId(id) && !isRobotServerSettingFieldId(id)
}

function isRobotServerSettingFieldId(
  id: SettingFieldId
): id is RobotServerSettingFieldId {
  return (ACCESS_CONTROL_SETTING_KEYS as readonly string[]).includes(id)
}

function isUiOnlyParentToggle(field: ToggleFieldConfig): boolean {
  return field.children != null && !isAuthSettingFieldId(field.id)
}

function getAuthSettingFieldValue(
  key: AuthSettingFieldId,
  authSettings: AuthSettingsResponse['data']
): string | boolean {
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
): Partial<Pick<FieldValues, AuthSettingFieldId>> {
  if (authSettings == null) {
    return {}
  }

  return (Object.keys(authSettings) as AuthSettingFieldId[]).reduce(
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
  } as FieldValues
}

function getAuthChildFieldIds(
  field: ToggleFieldConfig
): AuthSettingFieldId[] {
  return (field.children ?? []).flatMap(child => {
    if (child.type === 'input') {
      return [child.id]
    }
    return [child.id as AuthSettingFieldId, ...getAuthChildFieldIds(child)]
  })
}

function getAuthFieldPatchValue(
  key: AuthSettingFieldId,
  values: FieldValues
): NonNullable<PatchAuthSettingsRequest['data']>[AuthSettingFieldId] {
  switch (key) {
    case 'passwordResetTime': {
      const days = String(values.passwordResetTime)
      return days === '' ? null : Number(days) * SECONDS_PER_DAY
    }
    case 'idleLogout':
      return Number(values.idleLogout) * SECONDS_PER_MINUTE
    case 'passwordComplexityMinimumLength':
      return Number(values.passwordComplexityMinimumLength)
    case 'passwordComplexitySpecialCharacters':
      return Boolean(values.passwordComplexitySpecialCharacters)
    case 'minLengthOfReasonForInteraction':
      return Number(values.minLengthOfReasonForInteraction)
    case 'maxNumberOfLoginAttempts': {
      const value = String(values.maxNumberOfLoginAttempts)
      return value === '' ? null : Number(value)
    }
    default:
      return values[key] as boolean
  }
}

function buildChildGroupPatchRequest(
  parentField: ToggleFieldConfig,
  values: FieldValues
): PatchAuthSettingsRequest {
  return {
    data: Object.fromEntries(
      getAuthChildFieldIds(parentField).map(key => [
        key,
        getAuthFieldPatchValue(key, values),
      ])
    ) as PatchAuthSettingsRequest['data'],
  }
}

function getParentDisabledFieldValues(
  parentField: ToggleFieldConfig,
  values: FieldValues
): FieldValues {
  const childIds = getAuthChildFieldIds(parentField)

  return {
    ...values,
    [parentField.id]: false,
    ...Object.fromEntries(
      childIds.map(key => [
        key,
        typeof values[key] === 'boolean' ? false : '',
      ])
    ),
  } as FieldValues
}

function buildParentDisablePatchRequest(
  parentField: ToggleFieldConfig
): PatchAuthSettingsRequest {
  return {
    data: Object.fromEntries(
      getAuthChildFieldIds(parentField).map(key => [key, null])
    ) as PatchAuthSettingsRequest['data'],
  }
}

function buildStandaloneInputPatchRequest(
  id: AuthSettingFieldId,
  value: string
): PatchAuthSettingsRequest | null {
  switch (id) {
    case 'maxNumberOfLoginAttempts':
      return {
        data: {
          maxNumberOfLoginAttempts: value === '' ? null : Number(value),
        },
      }
    case 'idleLogout':
      return value === ''
        ? null
        : { data: { idleLogout: Number(value) * SECONDS_PER_MINUTE } }
    default:
      return null
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
  parentField?: ToggleFieldConfig
  values: FieldValues
  onInputChange: (
    id: AuthSettingFieldId,
    value: string,
    parentField?: ToggleFieldConfig
  ) => void
  onToggleChange: (
    field: ToggleFieldConfig,
    parentField?: ToggleFieldConfig
  ) => void
}

function ComplianceReadySettingField({
  field,
  parentField,
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
          onInputChange(field.id, event.target.value, parentField)
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
          onToggleChange(field, parentField)
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
              key={`${field.id}-${child.id}`}
              field={child}
              parentField={field}
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
  onInputChange: (
    id: AuthSettingFieldId,
    value: string,
    parentField?: ToggleFieldConfig
  ) => void
  onToggleChange: (
    field: ToggleFieldConfig,
    parentField?: ToggleFieldConfig
  ) => void
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
  const { patchAuthSettings } = useAuthSettingsMutation()
  const { patchAccessControlSettings } = usePatchAccessControlSettingsMutation()
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

  const patchAuth = (request: PatchAuthSettingsRequest): void => {
    patchAuthSettings(request, {
      onSuccess: response => {
        setFieldValues(
          getFieldValuesFromSettings(
            response.data,
            accessControlSettingsQuery.data?.data
          )
        )
      },
    })
  }

  const patchRobotSettings = (
    request: PatchAccessControlSettingsRequest
  ): void => {
    patchAccessControlSettings(request, {
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

  const handleInputChange = (
    id: AuthSettingFieldId,
    value: string,
    parentField?: ToggleFieldConfig
  ): void => {
    const nextValues: FieldValues = { ...fieldValues, [id]: value }
    setFieldValues(nextValues)

    if (parentField?.children != null) {
      if (!Boolean(nextValues[parentField.id]) || value === '') {
        return
      }
      if (isUiOnlyParentToggle(parentField)) {
        patchAuth(buildChildGroupPatchRequest(parentField, nextValues))
      } else {
        patchAuth({ data: { [id]: getAuthFieldPatchValue(id, nextValues) } })
      }
      return
    }

    const request = buildStandaloneInputPatchRequest(id, value)
    if (request != null) {
      patchAuth(request)
    }
  }

  const handleToggleChange = (
    field: ToggleFieldConfig,
    parentField?: ToggleFieldConfig
  ): void => {
    const toggledOn = !Boolean(fieldValues[field.id])

    if (field.children != null && isUiOnlyParentToggle(field)) {
      if (toggledOn) {
        setFieldValues({ ...fieldValues, [field.id]: true })
      } else {
        setFieldValues(getParentDisabledFieldValues(field, fieldValues))
        patchAuth(buildParentDisablePatchRequest(field))
      }
      return
    }

    if (parentField?.children != null && isUiOnlyParentToggle(parentField)) {
      const nextValues: FieldValues = { ...fieldValues, [field.id]: toggledOn }
      if (!Boolean(nextValues[parentField.id])) {
        setFieldValues(nextValues)
        return
      }
      patchAuth(buildChildGroupPatchRequest(parentField, nextValues))
      return
    }

    if (isRobotServerSettingFieldId(field.id)) {
      patchRobotSettings({ data: { [field.id]: toggledOn } })
      return
    }

    patchAuth({ data: { [field.id]: toggledOn } })
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
