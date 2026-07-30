export interface RobotServerAccessControlSettingsData {
  requireSignoffForProtocolLog?: boolean | null
  requireLogsToBeSavedInApp?: boolean | null
  deleteOverMaxOnDiskProtocols?: boolean | null
}

export interface RobotServerAccessControlSettingsResponse {
  data: RobotServerAccessControlSettingsData
}

export interface PatchRobotServerAccessControlSettingsRequest {
  data: Partial<RobotServerAccessControlSettingsData>
}
