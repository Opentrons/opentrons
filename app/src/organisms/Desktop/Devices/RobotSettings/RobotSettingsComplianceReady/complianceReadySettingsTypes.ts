import type {
  AccessControlAppSettingsData,
  AuthSettingsData,
} from '@opentrons/api-client'

export type AuthSettingFieldId = keyof AuthSettingsData

export type AppAccessControlSettingFieldId = keyof AccessControlAppSettingsData

export const UI_ONLY_FIELD_IDS = [
  'passwordResetEnabled',
  'passwordComplexityEnabled',
] as const

export type UiSettingFieldId = (typeof UI_ONLY_FIELD_IDS)[number]

export type SettingFieldId =
  | AuthSettingFieldId
  | UiSettingFieldId
  | AppAccessControlSettingFieldId

/** Field id exists only in the UI and has no server counterpart. */
export function isUiOnlyFieldId(id: SettingFieldId): id is UiSettingFieldId {
  return (UI_ONLY_FIELD_IDS as readonly string[]).includes(id)
}

export type FieldValues = Record<SettingFieldId, string | boolean>

export interface InputFieldConfig {
  type: 'input'
  id: AuthSettingFieldId
  labelKey: string
  unitsKey?: string
}

export interface ToggleFieldConfig {
  type: 'toggle'
  id: SettingFieldId
  labelKey: string
  children?: Array<InputFieldConfig | ToggleFieldConfig>
}

export type ComplianceReadyFieldConfig = InputFieldConfig | ToggleFieldConfig

export interface ComplianceReadySettingsSectionConfig {
  titleKey: string
  fields: ComplianceReadyFieldConfig[]
}
