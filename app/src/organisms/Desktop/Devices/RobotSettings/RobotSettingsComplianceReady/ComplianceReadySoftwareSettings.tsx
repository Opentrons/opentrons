import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Divider, StyledText } from '@opentrons/components'
import {
  useAccessControlSettingsQuery,
  useAuthSettingsMutation,
  useAuthSettingsQuery,
  usePatchAccessControlSettingsMutation,
} from '@opentrons/react-api-client'

import { ToggleButton } from '/app/atoms/buttons'

import { Accordion } from './Accordion'
import { SETTINGS_SECTIONS } from './complianceReadySettingsConfig'
import {
  getAuthPatchForInputChange,
  getFieldValuesFromSettings,
  resolveComplianceReadyToggleChange,
} from './complianceReadySettingsHelper'
import styles from './compliancereadysoftwaresettings.module.css'
import { InputSetting } from './InputSetting'

import type { JSX } from 'react'
import type {
  PatchAccessControlSettingsRequest,
  PatchAuthSettingsRequest,
} from '@opentrons/api-client'
import type {
  AuthSettingFieldId,
  ComplianceReadyFieldConfig,
  ComplianceReadySettingsSectionConfig,
  FieldValues,
  ToggleFieldConfig,
} from './complianceReadySettingsTypes'

export type { UiSettingFieldId } from './complianceReadySettingsTypes'
export { UI_ONLY_FIELD_IDS } from './complianceReadySettingsTypes'

export interface ComplianceReadySoftwareSettingsProps {
  robotName: string
}

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

  const patchRobotServerSettings = (
    request: PatchAccessControlSettingsRequest
  ): void => {
    throw new Error('Not implemented')
  }

  const handleInputChange = (
    id: AuthSettingFieldId,
    value: string,
    parentField?: ToggleFieldConfig
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
    field: ToggleFieldConfig,
    parentField?: ToggleFieldConfig
  ): void => {
    const { fieldValues: nextFieldValues, patch } =
      resolveComplianceReadyToggleChange(
        field,
        fieldValues,
        parentField,
        authSettingsQuery.data?.data,
        accessControlSettingsQuery.data?.data
      )
    setFieldValues(nextFieldValues)
    if (patch?.target === 'auth') {
      patchAuth(patch.request)
    } else if (patch?.target === 'robot') {
      patchRobotServerSettings(patch.request)
    }
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
