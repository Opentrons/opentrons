import {
  AUTH_SERVER_SETTING_FIELD_IDS,
  isAuthInputFieldId,
  isAuthServerSettingKey,
  isRobotServerSettingKey,
  isUiOnlyFieldId,
  ROBOT_SERVER_SETTING_FIELD_IDS,
} from './complianceReadySettingsTypes'

import type {
  AccessControlAppSettingsData,
  AuthSettingsData,
  PatchAppAccessControlSettingsRequest,
  PatchAuthSettingsRequest,
} from '@opentrons/api-client'
import type {
  AppAccessControlSettingFieldId,
  AuthSettingFieldId,
  ComplianceReadyToggleFieldDescriptor,
  FieldValues,
  SettingFieldId,
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

function getClearedFieldValue(id: SettingFieldId): string | boolean {
  return isAuthInputFieldId(id) ? '' : false
}

/** Map auth and app access-control settings responses to form field values. */
export function getFieldValuesFromSettings(
  authSettings?: AuthSettingsData,
  appAccessControlSettings?: AccessControlAppSettingsData
): FieldValues {
  const authSettingsData = authSettings ?? {}
  const appAccessControlSettingsData = appAccessControlSettings ?? {}

  const authFieldValues = (
    Object.keys(AUTH_SERVER_SETTING_FIELD_IDS) as AuthSettingFieldId[]
  ).reduce<Partial<Pick<FieldValues, AuthSettingFieldId>>>(
    (acc, key) => ({
      ...acc,
      [key]: getAuthSettingFieldValue(key, authSettingsData),
    }),
    {}
  )

  const appAccessControlFieldValues = (
    Object.keys(
      ROBOT_SERVER_SETTING_FIELD_IDS
    ) as AppAccessControlSettingFieldId[]
  ).reduce<Partial<Pick<FieldValues, AppAccessControlSettingFieldId>>>(
    (acc, key) => ({
      ...acc,
      [key]: appAccessControlSettingsData[key] ?? false,
    }),
    {}
  )

  return {
    ...(authFieldValues as Pick<FieldValues, AuthSettingFieldId>),
    passwordResetEnabled: Boolean(authSettingsData.passwordResetTime),
    passwordComplexityEnabled:
      Boolean(authSettingsData.passwordComplexityMinimumLength) ||
      Boolean(authSettingsData.passwordComplexitySpecialCharacters),
    ...(appAccessControlFieldValues as Pick<
      FieldValues,
      AppAccessControlSettingFieldId
    >),
  }
}

/** Updated form state and an optional patch to persist the change. */
export interface ComplianceReadyToggleChangeResult {
  fieldValues: FieldValues
  authPatch?: PatchAuthSettingsRequest
  appAccessControlPatch?: PatchAppAccessControlSettingsRequest
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

function buildAuthPatch(
  id: AuthSettingFieldId,
  values: FieldValues
): PatchAuthSettingsRequest {
  return { data: { [id]: getAuthFieldPatchValue(id, values) } }
}

function buildParentDisablePatches(
  parentField: ComplianceReadyToggleFieldDescriptor
): {
  authPatch?: PatchAuthSettingsRequest
  appAccessControlPatch?: PatchAppAccessControlSettingsRequest
} {
  const authData: PatchAuthSettingsRequest['data'] = {}
  const appAccessControlData: PatchAppAccessControlSettingsRequest['data'] = {}

  for (const childId of parentField.children ?? []) {
    if (isAuthServerSettingKey(childId)) {
      authData[childId] = null
    } else if (isRobotServerSettingKey(childId)) {
      appAccessControlData[childId] = null
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

/**
 * Auth-server patch for an input value, if it should be persisted.
 */
export function getAuthPatchForInputChange(
  id: AuthSettingFieldId,
  value: string,
  fieldValues: FieldValues,
  parentField?: ComplianceReadyToggleFieldDescriptor
): PatchAuthSettingsRequest | null {
  const nextFieldValues: FieldValues = { ...fieldValues, [id]: value }

  if (parentField != null) {
    if (!Boolean(nextFieldValues[parentField.id]) || value === '') {
      return null
    }
  } else if (
    (id !== 'maxNumberOfLoginAttempts' && id !== 'idleLogout') ||
    (id === 'idleLogout' && value === '')
  ) {
    return null
  }

  return buildAuthPatch(id, nextFieldValues)
}

/**
 * Resolve updated form state and an optional patch for a toggle change.
 */
export function resolveComplianceReadyToggleChange(
  field: ComplianceReadyToggleFieldDescriptor,
  fieldValues: FieldValues,
  parentField?: ComplianceReadyToggleFieldDescriptor
): ComplianceReadyToggleChangeResult {
  const toggledOn = !Boolean(fieldValues[field.id])
  const nextFieldValues: FieldValues = { ...fieldValues, [field.id]: toggledOn }

  if (isUiOnlyFieldId(field.id) && field.children != null) {
    if (toggledOn) {
      return { fieldValues: nextFieldValues }
    }

    const clearedFieldValues: FieldValues = {
      ...nextFieldValues,
      [field.id]: false,
    }
    for (const childId of field.children) {
      clearedFieldValues[childId] = getClearedFieldValue(childId)
    }

    return {
      fieldValues: clearedFieldValues,
      ...buildParentDisablePatches(field),
    }
  }

  if (parentField != null) {
    if (
      !Boolean(nextFieldValues[parentField.id]) ||
      !isAuthServerSettingKey(field.id)
    ) {
      return { fieldValues: nextFieldValues }
    }
    return {
      fieldValues: nextFieldValues,
      authPatch: buildAuthPatch(field.id, nextFieldValues),
    }
  }

  if (isRobotServerSettingKey(field.id)) {
    return {
      fieldValues: nextFieldValues,
      appAccessControlPatch: { data: { [field.id]: toggledOn } },
    }
  }

  if (isAuthServerSettingKey(field.id)) {
    return {
      fieldValues: nextFieldValues,
      authPatch: buildAuthPatch(field.id, nextFieldValues),
    }
  }

  return { fieldValues: nextFieldValues }
}
