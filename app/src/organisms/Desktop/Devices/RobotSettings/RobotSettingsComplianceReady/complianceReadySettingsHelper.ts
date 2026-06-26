import {
  AccessControlAppSettingsData,
  AuthSettingsData,
} from '@opentrons/api-client'

import { SETTINGS_SECTIONS } from './complianceReadySettingsConfig'
import { isUiOnlyFieldId } from './complianceReadySettingsTypes'

import type {
  PatchAppAccessControlSettingsRequest,
  PatchAuthSettingsRequest,
} from '@opentrons/api-client'
import type {
  AppAccessControlSettingFieldId,
  AuthSettingFieldId,
  FieldValues,
  InputFieldConfig,
  ToggleFieldConfig,
} from './complianceReadySettingsTypes'

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60

function getAuthSettingFieldValue(
  key: AuthSettingFieldId,
  authSettings: AuthSettingsData
): string | boolean {
  switch (key) {
    case 'idleLogout':
      return authSettings.idleLogout != null
        ? String(Math.round(authSettings.idleLogout / SECONDS_PER_MINUTE))
        : ''
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
  authSettings: AuthSettingsData
): Pick<FieldValues, AuthSettingFieldId> {
  const fieldValues = (
    Object.keys(authSettings) as AuthSettingFieldId[]
  ).reduce<Partial<Pick<FieldValues, AuthSettingFieldId>>>(
    (acc, key) => ({
      ...acc,
      [key]: getAuthSettingFieldValue(key, authSettings),
    }),
    {}
  )

  return fieldValues as Pick<FieldValues, AuthSettingFieldId>
}

function getAppAccessControlFieldValues(
  appAccessControlSettings: AccessControlAppSettingsData
): Pick<FieldValues, AppAccessControlSettingFieldId> {
  const fieldValues = (
    Object.keys(appAccessControlSettings) as AppAccessControlSettingFieldId[]
  ).reduce<Partial<Pick<FieldValues, AppAccessControlSettingFieldId>>>(
    (acc, key) => ({
      ...acc,
      [key]: appAccessControlSettings[key] ?? false,
    }),
    {}
  )

  return fieldValues as Pick<FieldValues, AppAccessControlSettingFieldId>
}

/** Map auth and app access-control settings responses to form field values. */
export function getFieldValuesFromSettings(
  authSettings?: AuthSettingsData,
  appAccessControlSettings?: AccessControlAppSettingsData
): FieldValues {
  const authSettingsData = authSettings ?? new AuthSettingsData()
  const appAccessControlSettingsData =
    appAccessControlSettings ?? new AccessControlAppSettingsData()

  const fieldValues: FieldValues = {
    ...getAuthFieldValues(authSettingsData),
    passwordResetEnabled: Boolean(authSettingsData.passwordResetTime),
    passwordComplexityEnabled:
      Boolean(authSettingsData.passwordComplexityMinimumLength) ||
      Boolean(authSettingsData.passwordComplexitySpecialCharacters),
    ...getAppAccessControlFieldValues(appAccessControlSettingsData),
  }
  return fieldValues
}

function getFieldChildren(
  field: ToggleFieldConfig
): Array<InputFieldConfig | ToggleFieldConfig> {
  return field.children ?? []
}

/** Form values after nested child fields are cleared (parent turned off). */
function getFieldValuesWithChildrenCleared(
  parentField: ToggleFieldConfig,
  fieldValues: FieldValues
): FieldValues {
  const nextFieldValues: FieldValues = {
    ...fieldValues,
    [parentField.id]: false,
  }

  for (const child of getFieldChildren(parentField)) {
    nextFieldValues[child.id] = child.type === 'input' ? '' : false
  }

  return nextFieldValues
}

/** Updated form state and an optional patch to persist the change. */
export interface ComplianceReadyToggleChangeResult {
  fieldValues: FieldValues
  authPatch?: PatchAuthSettingsRequest
  appAccessControlPatch?: PatchAppAccessControlSettingsRequest
}

/**
 * Parent toggle that groups nested fields in the UI but is not itself an API key
 * (e.g. `passwordResetEnabled`).
 */
function isUiOnlyParentToggle(field: ToggleFieldConfig): boolean {
  return getFieldChildren(field).length > 0 && isUiOnlyFieldId(field.id)
}

/**
 * Convert a form field value to the shape expected by PATCH `/auth/settings`.
 * Handles display-unit conversion (minutes/days) and empty-string → null.
 */
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

/** PATCH body with a single changed auth setting field. */
function buildAuthFieldPatchRequest(
  id: AuthSettingFieldId,
  value: NonNullable<PatchAuthSettingsRequest['data']>[AuthSettingFieldId]
): PatchAuthSettingsRequest {
  return { data: { [id]: value } }
}

/**
 * PATCH requests sent when a UI-only parent toggle is turned off.
 * Nulls every nested child field on the server it belongs to.
 */
function buildParentDisablePatches(parentField: ToggleFieldConfig): {
  authPatch?: PatchAuthSettingsRequest
  appAccessControlPatch?: PatchAppAccessControlSettingsRequest
} {
  const authData: PatchAuthSettingsRequest['data'] = {}
  const appAccessControlData: PatchAppAccessControlSettingsRequest['data'] = {}

  for (const { id } of getFieldChildren(parentField)) {
    if (AuthSettingsData.hasSettingKey(id)) {
      authData[id] = null
    } else if (AccessControlAppSettingsData.hasSettingKey(id)) {
      appAccessControlData[id] = null
    }
  }

  return {
    ...(Object.keys(authData).length > 0
      ? { authPatch: { data: authData } }
      : {}),
    ...(Object.keys(appAccessControlData).length > 0
      ? { appAccessControlPatch: { data: appAccessControlData } }
      : {}),
  }
}

/** Top-level input fields from config (not nested under a parent toggle). */
function isTopLevelInputField(id: AuthSettingFieldId): boolean {
  return SETTINGS_SECTIONS.some(section =>
    section.fields.some(
      (field): field is InputFieldConfig =>
        field.type === 'input' && field.id === id
    )
  )
}

/**
 * Returns true when a standalone input change should be persisted.
 * idleLogout is non-nullable on the auth server, so clearing the field must
 * not send a PATCH until the user enters a valid number of minutes.
 */
function shouldPersistStandaloneInputChange(
  id: AuthSettingFieldId,
  value: string
): boolean {
  if (!isTopLevelInputField(id)) {
    return false
  }

  if (id === 'idleLogout' && value === '') {
    return false
  }

  return true
}

/**
 * Auth-server patch for an input value, if it should be persisted.
 */
export function getAuthPatchForInputChange(
  id: AuthSettingFieldId,
  value: string,
  fieldValues: FieldValues,
  parentField?: ToggleFieldConfig
): PatchAuthSettingsRequest | null {
  const nextFieldValues: FieldValues = { ...fieldValues, [id]: value }

  if (parentField?.children != null) {
    if (!Boolean(nextFieldValues[parentField.id]) || value === '') {
      return null
    }
    return buildAuthFieldPatchRequest(
      id,
      getAuthFieldPatchValue(id, nextFieldValues)
    )
  }

  if (shouldPersistStandaloneInputChange(id, value)) {
    return buildAuthFieldPatchRequest(
      id,
      getAuthFieldPatchValue(id, nextFieldValues)
    )
  }

  return null
}

/**
 * Resolve updated form state and an optional patch for a toggle change.
 *
 * Unlike inputs, toggles can update multiple local fields at once (e.g. turning
 * off a UI-only parent clears all nested children via getFieldValuesFromSettings).
 */
export function resolveComplianceReadyToggleChange(
  field: ToggleFieldConfig,
  fieldValues: FieldValues,
  parentField?: ToggleFieldConfig
): ComplianceReadyToggleChangeResult {
  const toggledOn = !Boolean(fieldValues[field.id])

  if (isUiOnlyParentToggle(field)) {
    if (toggledOn) {
      return { fieldValues: { ...fieldValues, [field.id]: true } }
    }
    return {
      fieldValues: getFieldValuesWithChildrenCleared(field, fieldValues),
      ...buildParentDisablePatches(field),
    }
  }

  if (parentField?.children != null) {
    const nextFieldValues: FieldValues = {
      ...fieldValues,
      [field.id]: toggledOn,
    }
    if (!Boolean(nextFieldValues[parentField.id])) {
      return { fieldValues: nextFieldValues }
    }
    if (!AuthSettingsData.hasSettingKey(field.id)) {
      return { fieldValues: nextFieldValues }
    }
    return {
      fieldValues: nextFieldValues,
      authPatch: buildAuthFieldPatchRequest(
        field.id,
        getAuthFieldPatchValue(field.id, nextFieldValues)
      ),
    }
  }

  if (AccessControlAppSettingsData.hasSettingKey(field.id)) {
    return {
      fieldValues: { ...fieldValues, [field.id]: toggledOn },
      appAccessControlPatch: { data: { [field.id]: toggledOn } },
    }
  }

  if (AuthSettingsData.hasSettingKey(field.id)) {
    const nextFieldValues: FieldValues = {
      ...fieldValues,
      [field.id]: toggledOn,
    }

    return {
      fieldValues: nextFieldValues,
      authPatch: buildAuthFieldPatchRequest(
        field.id,
        getAuthFieldPatchValue(field.id, nextFieldValues)
      ),
    }
  }

  return {
    fieldValues: { ...fieldValues, [field.id]: toggledOn },
  }
}
