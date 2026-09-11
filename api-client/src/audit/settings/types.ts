export interface AuditSettingsData {
  requireReasonForInteraction?: boolean
  minLengthOfReasonForInteraction?: number | null
}

export interface AuditSettingsResponse {
  data: AuditSettingsData
}

export interface PatchAuditSettingsRequest {
  data: Partial<{ [K in keyof AuditSettingsData]: AuditSettingsData[K] | null }>
}
