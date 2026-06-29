export interface AccessControlAppSettingsData {
  requireSignoffForProtocolLog?: boolean | null
  requireLogsToBeSavedInApp?: boolean | null
  deleteOverMaxOnDiskProtocols?: boolean | null
}

export interface AccessControlAppSettingsResponse {
  data: AccessControlAppSettingsData
}

export type AccessControlAppSettingsKey = keyof AccessControlAppSettingsData

export interface PatchAppAccessControlSettingsRequest {
  data: Partial<AccessControlAppSettingsData>
}
