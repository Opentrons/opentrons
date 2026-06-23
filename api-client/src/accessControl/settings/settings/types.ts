export interface AccessControlAppSettingsResponse {
  data: {
    requireSignoffForProtocolLog: boolean
    requireLogsToBeSavedInApp: boolean
    deleteOverMaxOnDiskProtocols: boolean
  }
}

export type AccessControlAppSettingsKey = keyof AccessControlAppSettingsResponse['data']

const accessControlSettingsDataKeys = {
  requireSignoffForProtocolLog: false,
  requireLogsToBeSavedInApp: false,
  deleteOverMaxOnDiskProtocols: false,
} satisfies AccessControlAppSettingsResponse['data']

export const ACCESS_CONTROL_SETTING_KEYS = Object.keys(
  accessControlSettingsDataKeys
) as AccessControlAppSettingsKey[]

export interface PatchAccessControlSettingsRequest {
  data: {
    requireSignoffForProtocolLog?: boolean | null
    requireLogsToBeSavedInApp?: boolean | null
    deleteOverMaxOnDiskProtocols?: boolean | null
  }
}
