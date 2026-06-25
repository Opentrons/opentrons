export interface AccessControlAppSettingsResponse {
  data: {
    requireSignoffForProtocolLog: boolean
    requireLogsToBeSavedInApp: boolean
    deleteOverMaxOnDiskProtocols: boolean
  }
}

export type AccessControlAppSettingsKey =
  keyof AccessControlAppSettingsResponse['data']

const appAccessControlSettingsDataKeys = {
  requireSignoffForProtocolLog: false,
  requireLogsToBeSavedInApp: false,
  deleteOverMaxOnDiskProtocols: false,
} satisfies AccessControlAppSettingsResponse['data']

export const APP_ACCESS_CONTROL_SETTING_KEYS = Object.keys(
  appAccessControlSettingsDataKeys
) as AccessControlAppSettingsKey[]

export interface PatchAppAccessControlSettingsRequest {
  data: {
    requireSignoffForProtocolLog?: boolean | null
    requireLogsToBeSavedInApp?: boolean | null
    deleteOverMaxOnDiskProtocols?: boolean | null
  }
}
