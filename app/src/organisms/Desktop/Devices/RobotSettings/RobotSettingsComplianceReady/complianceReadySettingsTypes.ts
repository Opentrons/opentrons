import type {
  AccessControlAppSettingsResponse,
  AuthSettingsResponse,
} from '@opentrons/api-client'

export type AuthSettingFieldId = keyof AuthSettingsResponse['data']

export type AppAccessControlSettingFieldId =
  keyof AccessControlAppSettingsResponse['data']

export const UI_ONLY_FIELD_IDS = [
  'passwordResetEnabled',
  'passwordComplexityEnabled',
] as const

export type UiSettingFieldId = (typeof UI_ONLY_FIELD_IDS)[number]

export type SettingFieldId =
  | AuthSettingFieldId
  | UiSettingFieldId
  | AppAccessControlSettingFieldId

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
