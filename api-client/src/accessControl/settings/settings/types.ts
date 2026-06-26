export class AccessControlAppSettingsData {
  requireSignoffForProtocolLog?: boolean | null
  requireLogsToBeSavedInApp?: boolean | null
  deleteOverMaxOnDiskProtocols?: boolean | null

  static hasSettingKey(key: string): key is keyof AccessControlAppSettingsData {
    return key in new AccessControlAppSettingsData()
  }
}

export class AccessControlAppSettingsResponse {
  data!: AccessControlAppSettingsData

  static hasSettingKey(key: string): key is keyof AccessControlAppSettingsData {
    return AccessControlAppSettingsData.hasSettingKey(key)
  }
}

export type AccessControlAppSettingsKey = keyof AccessControlAppSettingsData

export interface PatchAppAccessControlSettingsRequest {
  data: {
    requireSignoffForProtocolLog?: boolean | null
    requireLogsToBeSavedInApp?: boolean | null
    deleteOverMaxOnDiskProtocols?: boolean | null
  }
}
