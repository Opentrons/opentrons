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
}

export type AccessControlAppSettingsKey = keyof AccessControlAppSettingsData

export interface PatchAppAccessControlSettingsRequest {
  data: Partial<AccessControlAppSettingsData>
}
