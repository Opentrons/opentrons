import type { SETTING_OPTIONS } from './constants'

export type SettingOption = typeof SETTING_OPTIONS[keyof typeof SETTING_OPTIONS]
